
/**Local BD*/
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('data/db_assistatv2.json')
const db = low(adapter);


class User {
constructor() {
	this.name="users";
	// init data base users array
	const name = this.name;
	const initTableJSON = JSON.parse('{"'+name+'":[]}');
	db.defaults(initTableJSON).write();
}

async save(id,assistant_id,session_id){
	db.get(this.name)
	.push({id: id,
				session_id:assistant_id,
				assistant_id:session_id
			})
	.write()
}
async delete(id){
	db.get(this.name)
	.remove({ user: id})
	.write();
}
async findByUserId(id){
	return db.get(this.name)
  .find({ id: id })
  .value()
}
}
module.exports = User;
