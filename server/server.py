from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import json_util
import json
import os
from pathlib import Path
from dotenv import load_dotenv

# ------------------------------
# LOAD ENV VARIABLES
# ------------------------------

# Check if CONNECTION_STRING is already in environment
CONNECTION_STRING = os.getenv("CONNECTION_STRING")

if not CONNECTION_STRING:
    # Try loading .env.local relative to project root
    repo_root = Path(__file__).resolve().parents[1]
    env_path = repo_root / ".env.local"

    if env_path.exists():
        load_dotenv(str(env_path))
        CONNECTION_STRING = os.getenv("CONNECTION_STRING")
        print(f"Loaded .env.local from {env_path}")
    else:
        # fallback to cwd
        load_dotenv(".env.local")
        CONNECTION_STRING = os.getenv("CONNECTION_STRING")
        print("Loaded .env.local from cwd")

if not CONNECTION_STRING:
    raise RuntimeError(
        "CONNECTION_STRING not found. "
        "Set it in Render environment variables or .env.local locally."
    )

# ------------------------------
# INIT APP
# ------------------------------
app = Flask(__name__)
CORS(app)

# ------------------------------
# DATABASE INIT
# ------------------------------
client = MongoClient(os.getenv("CONNECTION_STRING"))
db = client["user_data"]
members = db["membership_info"]
budgets = db["committee_budget"]
requests_collection = db["requests"]  # avoid collision w/ flask.request

# ------------------------------
# HELPERS
# ------------------------------
def parse_json(data):
    return json.loads(json_util.dumps(data))


# ------------------------------
# ROUTES
# ------------------------------

@app.route("/getMemberData", methods=["GET"])
def get_member_data():
    user_id = request.args.get("userId")
    member = members.find_one({"_id": user_id})
    if not member:
        return jsonify({"success": False, "error": "Member not found"}), 404

    member_data = {
        "name": member["name"],
        "memberType": member["memberType"].upper(),
        "pledgeClass": member["pledgeClass"],
        "userId": member["_id"],
        "dues": {
            "totalDue": member["dues"]["totalDue"],
            "totalPaid": member["dues"]["totalPaid"],
            "status": member["dues"]["status"],
        }
    }
    return jsonify({"success": True, "member": member_data}), 200


@app.route("/createMember", methods=["POST"])
def create_member():
    data = request.get_json()
    new_member = {
        "_id": data["userId"],
        "name": data["name"],
        "memberType": data["memberType"],
        "pledgeClass": data["pledgeClass"].upper(),
        "dues": {
            "totalDue": 350 if data["memberType"].upper() == "PLEDGE" else 250,
            "totalPaid": 0,
            "status": "ACTIVE",
        }
    }
    result = members.insert_one(new_member)
    return (
        jsonify({"success": True, "member": parse_json(new_member)}),
        201
    ) if result.acknowledged else (
        jsonify({"success": False, "error": "Insert failed"}), 500
    )


@app.route("/updateStatus", methods=["PATCH"])
def update_status():
    data = request.get_json()
    user_id = data.get("userId")
    new_status = data.get("status")
    valid_statuses = ["ACTIVE", "LOA", "PART-TIME"]

    if new_status not in valid_statuses:
        return jsonify({
            "success": False,
            "error": "Invalid status. Must be ACTIVE, LOA, or PART-TIME"
        }), 400

    result = members.update_one({"_id": user_id}, {"$set": {"dues.status": new_status}})
    if result.modified_count == 0:
        return jsonify({"success": False, "error": "Member not found"}), 404

    updated_member = members.find_one({"_id": user_id})
    return jsonify({
        "success": True,
        "member": {
            "name": updated_member["name"],
            "memberType": updated_member["memberType"],
            "pledgeClass": updated_member["pledgeClass"],
            "dues": updated_member["dues"]
        }
    }), 200


@app.route("/add_committee", methods=["POST"])
def add_committee():
    data = request.json
    committee = {
        "name": data.get("name"),
        "budget": data.get("budget"),
        "activities": data.get("activities"),
    }
    budgets.replace_one({"name": committee["name"]}, committee, upsert=True)
    return jsonify({"message": "Committee added successfully!"}), 201


@app.route("/get_committees", methods=["GET"])
def get_committees():
    committees = list(budgets.find({}))
    for c in committees:
        c["_id"] = str(c["_id"])
    return jsonify(committees), 200


@app.route("/get_committee_budgets", methods=["GET"])
def get_committee_budgets():
    committees = list(budgets.find({}, {"name": 1, "budget": 1, "activities": 1}))
    for c in committees:
        c["_id"] = str(c["_id"])
    return jsonify(committees), 200


@app.route("/requests", methods=["GET"])
def get_requests():
    pending = list(requests_collection.find({"status": "pending"}))
    for r in pending:
        r["_id"] = str(r["_id"])
    return jsonify(pending), 200


@app.route("/requests/accepted", methods=["GET"])
def get_accepted_requests():
    accepted = list(requests_collection.find({"status": "accepted"}))
    for r in accepted:
        r["_id"] = str(r["_id"])
    return jsonify(accepted), 200


@app.route("/requests/declined", methods=["GET"])
def get_declined_requests():
    declined = list(requests_collection.find({"status": "declined"}))
    for r in declined:
        r["_id"] = str(r["_id"])
    requests_collection.delete_many({"status": "declined"})
    return jsonify(declined), 200


@app.route("/requests/<id>", methods=["POST"])
def update_request(id):
    status = request.json.get("status")
    requests_collection.update_one(
        {"_id": str(id)},
        {"$set": {"status": status, "dateProcessed": datetime.now()}}
    )
    return jsonify({"message": "Request updated successfully"}), 200


@app.route("/requests/new", methods=["POST"])
def create_request():
    data = request.json
    new_request = {
        "department": data.get("department"),
        "amount": float(data.get("amount")),
        "description": data.get("description"),
        "requester": data.get("requester"),
        "status": "pending",
        "dateSubmitted": datetime.now()
    }
    result = requests_collection.insert_one(new_request)
    return jsonify({"message": "Request created successfully", "id": str(result.inserted_id)}), 201

# Test route
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "BudgetCents API is live!"}), 200

# ------------------------------
# LOCAL DEV ONLY
# ------------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
