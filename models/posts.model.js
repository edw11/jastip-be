import mongoose from "mongoose";

// Define the schema
const postsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      lowercase: true, // Make the email lowercase for consistency
      trim: true, // Remove any leading/trailing whitespace
    },
    price: {
      type: String,
      required: true,
    },
    quota: {
      type: String,
      required: true,
    },
    author_id: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the model
const Post = mongoose.model("Post", postsSchema);

export { Post };
