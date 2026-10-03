from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
from bson import ObjectId
from bson.errors import InvalidId
from pymongo.errors import ServerSelectionTimeoutError

app = Flask(__name__)
app.config['MONGO_URI'] = 'mongodb://localhost:27017/crudapp?serverSelectionTimeoutMS=3000'
mongo = PyMongo(app)
CORS(app)
db = mongo.db.users


@app.errorhandler(ServerSelectionTimeoutError)
def mongo_unavailable(_error):
   return jsonify({'error': 'MongoDB is unavailable. Start MongoDB and retry.'}), 503
@app.route("/users", methods=["POST"])
def createUser():
   user, error = user_payload()
   if error:
      return error
   result = db.insert_one(user)
   return jsonify({'_id': str(result.inserted_id), 'message': 'User added successfully'}), 201
@app.route('/users', methods=['GET'])
def getUsers():
   users =[]
   for doc in db.find():
      users.append({
         '_id': str(ObjectId(doc['_id'])),
         'name': doc['name'],
         'email': doc['email'],
         'contact': doc['contact'],
         'address': doc['address'],
      })
   return jsonify(users)


def user_payload():
   payload = request.get_json(silent=True)
   if not isinstance(payload, dict):
      return None, (jsonify({'error': 'A JSON object is required'}), 400)
   fields = ('name', 'email', 'contact', 'address')
   user = {field: str(payload.get(field) or '').strip() for field in fields}
   missing = [field for field in fields if not user[field]]
   if missing:
      return None, (jsonify({'error': f"Required fields: {', '.join(missing)}"}), 400)
   return user, None


def parse_user_id(user_id):
   try:
      return ObjectId(user_id)
   except (InvalidId, TypeError):
      return None


@app.route('/users/<user_id>', methods=['PUT'])
def update_user(user_id):
   object_id = parse_user_id(user_id)
   if object_id is None:
      return jsonify({'error': 'Invalid user ID'}), 400
   user, error = user_payload()
   if error:
      return error
   result = db.update_one({'_id': object_id}, {'$set': user})
   if result.matched_count == 0:
      return jsonify({'error': 'User not found'}), 404
   return jsonify({'_id': user_id, 'message': 'User updated successfully'})


@app.route('/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
   object_id = parse_user_id(user_id)
   if object_id is None:
      return jsonify({'error': 'Invalid user ID'}), 400
   result = db.delete_one({'_id': object_id})
   if result.deleted_count == 0:
      return jsonify({'error': 'User not found'}), 404
   return jsonify({'message': 'User deleted successfully'})


if __name__ == '__main__':app.run(debug=True)