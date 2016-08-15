var mongoose = require('mongoose');

//Patient Schema
var PatientSchema = new mongoose.Schema({
	permissionTo: String,
	permissionBy: String,
	steps: Boolean,
	heartrate: Boolean,
	distance: Boolean,
	calories: Boolean
});

var Patient = mongoose.model('Patient', PatientSchema);
module.exports = Patient;

