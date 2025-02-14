import mongoose from "mongoose";

// Define the schema
const usersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true, // Make the email lowercase for consistency
      trim: true, // Remove any leading/trailing whitespace
    },
    password: {
      type: String,
      required: true,
    },
    imgUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "Not approved",
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the model
const User = mongoose.model("User", usersSchema);

export { User };
