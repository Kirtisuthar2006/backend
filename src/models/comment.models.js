import mongoose,{Schema} from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
    content:{
        type:String,
        required:true,
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video",
    },
    owener:{
        type: Schema.Types.ObjectId,
        ref: "User",
    }

},{
    timestamps:true, // createdAt , updatedAt
})

commentSchema.plugin(mongooseAggregatePaginate)  // to add pagination feature

export const Comment = mongoose.model("Comment",commentSchema)