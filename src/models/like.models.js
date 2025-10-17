import mongoose,{Schema} from "mongoose";

const likeSchema = new Schema({

    video:{
        type:Schema.Types.ObjectId,
        ref:"Video",
    },
    Comment:{
        type:Schema.Types.ObjectId,
        ref:"Comment",
    },
    tweet:{
        type: Schema.Types.ObjectId,
        ref: "Tweet",
    },
    likedBY:{
        type: Schema.Types.ObjectId,
        ref: "User",
    }
},{
    timestamps:true, // createdAt , updatedAt
})



export const Like = mongoose.model("Like",likeSchema)