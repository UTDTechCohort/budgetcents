import datetime
from flask import Flask, request, jsonify
import json
from dotenv import load_dotenv
import os
from pathlib import Path
from flask_cors import CORS
from bson import ObjectId, json_util
from pymongo import MongoClient
from datetime import datetime

# Resolve .env.local in the repository root (server.py is in repo_root/server/)
repo_root = Path(__file__).resolve().parents[1]
env_path = repo_root / '.env.local'

if env_path.exists():
    load_dotenv(str(env_path))
    loaded_from = str(env_path)
else:
    # fallback to loading from working directory (for convenience)
    load_dotenv('.env.local')
    loaded_from = '.env.local (cwd)'

# Debug / sanity-check (do not print full secrets)
print(f"Loaded env file: {loaded_from}")
cs = os.getenv('CONNECTION_STRING') or ''
print("CONNECTION_STRING present:", bool(cs))
print("CONNECTION_STRING preview:", (cs[:50] + '...') if len(cs) > 50 else cs)

if not cs:
    # Fail fast with a clear error to avoid PyMongo defaulting to localhost
    raise RuntimeError("CONNECTION_STRING not found in environment. Set it in .env.local or export it before running the server.")


app = Flask(__name__)
CORS(app)

client = MongoClient(os.getenv('CONNECTION_STRING'))
members = client['user_data']['membership_info']
budgets = client['user_data']['committee_budget']
requests = client['user_data']['requests']

def parse_json(data):
    return json.loads(json_util.dumps(data))

@app.route('/getMemberData', methods=['GET'])
def getMemberData():
    member = members.find_one({'_id': request.args.get('userId')})
    print(member)
    if member:
        # Convert member data to proper JSON format
        member_data = {
            'name': member['name'],
            'memberType': member['memberType'].upper(),  # Ensures consistency in casing
            'pledgeClass': member['pledgeClass'],
            'userId': member['_id'],
            'dues': {
                'totalDue': member['dues']['totalDue'] ,
                'totalPaid': member['dues']['totalPaid'],
                'status': member['dues']['status'],
            }
        }
        
        return jsonify({
            'success': True,
            'member': member_data
        }), 200
    else:
        return jsonify({
            'success': False,
            'error': 'Member not found'
        }), 404

@app.route('/createMember', methods=['POST'])
def createMember():
    data = request.get_json()
    
    # Create new member document
    new_member = {
        '_id': data['userId'],  # Using Auth0 userId as primary key
        'name': data['name'],
        'memberType': data['memberType'],
        'pledgeClass': data['pledgeClass'].upper(),
        'dues': {
            'totalDue': 350 if data['memberType'].upper() == 'PLEDGE' else 250,
            'totalPaid': 0,
            'status': 'ACTIVE',
        }
        
    }
    
    # Insert into MongoDB
    result = members.insert_one(new_member)
    
    if result.acknowledged:
        return jsonify({
            'success': True,
            'member': parse_json(new_member)
        }), 201

@app.route('/updateStatus', methods=['PATCH'])
def updateStatus():
    data = request.get_json()
    print(data)
    new_status = data.get('status')
    user_id = data.get('userId')
    
    # Validate status
    valid_statuses = ['ACTIVE', 'LOA', 'PART-TIME']
    if new_status not in valid_statuses:
        return jsonify({
            'success': False,
            'error': 'Invalid status. Must be one of: ACTIVE, LOA, PART-TIME'
        }), 400

    # Update the status in MongoDB
    result = members.update_one(
        {'_id': user_id},
        {'$set': {'dues.status': new_status}}
    )

    if result.modified_count > 0:
        # Get updated member data
        updated_member = members.find_one({'_id': user_id})
        return jsonify({
            'success': True,
            'member': {
                'name': updated_member['name'],
                'memberType': updated_member['memberType'],
                'pledgeClass': updated_member['pledgeClass'],
                'dues': updated_member['dues']
            }
        }), 200
    else:
        return jsonify({
            'success': False,
            'error': 'Member not found'
        }), 404

@app.route('/add_committee', methods=['POST'])
def add_committee():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    committee = {
        "name": data.get("name"),
        "budget": data.get("budget"),
        "activities": data.get("activities"),
    }

    budgets.replace_one({"name": committee["name"]}, committee, upsert=True)
    return jsonify({"message": "Committee added successfully!"}), 201


@app.route('/get_committees', methods=['GET'])
def get_committees():
    committees = list(budgets.find({}))
    
    # Convert ObjectId to string for JSON serialization
    for budget in committees:
        budget['_id'] = str(budget['_id'])  # Convert ObjectId to string if you need the _id field

    return jsonify(committees), 200

@app.route('/get_committee_budgets', methods=['GET'])
def get_committee_budgets():
    # Retrieve all committees with only name and budget fields
    committees = list(budgets.find({}, {"name": 1, "budget": 1, "activities": 1}))
    
    # Convert ObjectId to string for JSON serialization
    for budget in committees:
        budget['_id'] = str(budget['_id'])  # Convert ObjectId to string if you need the _id field

    return jsonify(committees), 200

@app.route("/requests", methods=["GET"])
def get_requests():
    pending_requests = list(requests.find({"status": "pending"}))
    for request in pending_requests:
        request["_id"] = str(request["_id"])
    return jsonify(pending_requests)

@app.route("/requests/accepted", methods=["GET"])
def get_accepted_requests():
    accepted_requests = list(requests.find({"status": "accepted"}))
    for request in accepted_requests:
        request["_id"] = str(request["_id"])
    return jsonify(accepted_requests)

@app.route("/requests/declined", methods=["GET"])
def get_declined_requests():
    try:
        # Find all declined requests
        declined_requests = list(requests.find({"status": "declined"}))
        
        # Convert ObjectIds to strings for JSON serialization
        for request in declined_requests:
            request["_id"] = str(request["_id"])
        
        # Delete all declined requests
        requests.delete_many({"status": "declined"})
        
        return jsonify(declined_requests)
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "Failed to fetch declined requests"
        }), 400

@app.route("/requests/<id>", methods=["POST"])
def update_request(id):
    try:
        status = request.json.get("status")
        requests.update_one(
            {"_id": str(id)},
            {
                "$set": {
                    "status": status,
                    "dateProcessed": datetime.now()
                }
            }
        )
    except Exception as e:
        print(e)
    return jsonify({"message": "Request updated successfully"})

@app.route("/requests/new", methods=["POST"])
def create_request():
    try:
        # Get data from request body
        request_data = request.json
        print(request_data)
        # Create new document
        new_request = {
            "department": request_data.get("department"),
            "amount": float(request_data.get("amount")),
            "description": request_data.get("description"),
            "requester": request_data.get("requester"),
            "status": "pending",
            "dateSubmitted": datetime.now()
        }
        
        # Insert into MongoDB
        result = requests.insert_one(new_request)
        print(result)
        # Return success response with the new document's ID
        return jsonify({
            "message": "Request created successfully",
            "id": str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(e)
        return jsonify({
            "error": str(e),
            "message": "Failed to create request"
        }), 400

if __name__ == "__main__":
    app.run(debug=True)