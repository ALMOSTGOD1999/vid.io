import mongoose, { Schema } from "mongoose";

const tweetSchema = ({
  content: {
    type: String,
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
},
{ timestamps: true })();

export const Tweet = mongoose.model(Tweet, "tweetSchema");
