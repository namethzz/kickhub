const Field = require("../models/Field");

const addField = async (fieldData) => {
  try {
    const newField = new Field(fieldData);
    const savedField = await newField.save();
    return { success: true, data: savedField };
  } catch (error) {
    console.error("Error adding field:", error);
    return { success: false, error };
  }
};

const getFieldbyownerID = async (id) => {
  try {
    const fields = await Field.find({ owner_id: id });
    return { success: true, data: fields };
  } catch (error) {
    console.error("Error fetching fields:", error);
    return { success: false, error };
  }
};

const updateField = async (id, fieldData) => {
  try {
    const updatedField = await Field.findByIdAndUpdate(id, fieldData, {
      new: true,
      runValidators: true,
    });
    return { success: true, data: updatedField };
  } catch (error) {
    console.error("Error updating field:", error);
    return { success: false, error };
  }
};

const deleteField = async (id) => {
  try {
    const deletedField = await Field.findByIdAndDelete(id);
    return { success: true, data: deletedField };
  } catch (error) {
    console.error("Error deleting field:", error);
    return { success: false, error };
  }
};

module.exports = {
  addField,
  updateField,
  deleteField,
  getFieldbyownerID,
};
