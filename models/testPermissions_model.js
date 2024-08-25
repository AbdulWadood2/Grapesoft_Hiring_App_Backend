const mongoose = require("mongoose");

const testPermissionsSchema = new mongoose.Schema(
  {
    multiChoiceQuestions: {
      type: Number,
      default: 4,
    },
    openQuestionWords: {
      type: Number,
      default: 10,
    },
    fileDataMax: {
      type: Number,
      default: 100, // in MB
    },
  },
  {
    timestamps: true,
  }
);

const TestPermissions = mongoose.model(
  "testpermissions",
  testPermissionsSchema
);

// Function to create a default document if it does not exist
async function createDefaultTestPermissions() {
  try {
    await TestPermissions.findOneAndUpdate(
      {}, // Empty filter to search for any document
      {
        $setOnInsert: {
          multiChoiceQuestions: 4,
          openQuestionWords: 10,
          fileDataMax: 100,
        },
      },
      { upsert: true, new: true } // Options: create if not exists and return the new document
    );

    // console.log("Default test permissions created or found successfully.");
  } catch (error) {
    console.error("Error creating default test permissions:", error);
  }
}
createDefaultTestPermissions();
module.exports = TestPermissions;
