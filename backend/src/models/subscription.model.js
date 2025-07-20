import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
  subscriber: {
    type: Schema.Types.ObjectId, //user id who is subscribing
    ref: "User",
    required: true
  },
  channel: {
    type: Schema.Types.ObjectId, //the channel(user id) being subscribed to
    ref: "User",
    required: true
  }
}, {
  timestamps: true
})

export const Subscription = mongoose.model("Subscription", subscriptionSchema);