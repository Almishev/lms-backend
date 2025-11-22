import mongoose, {model, Schema, models} from "mongoose";

const BorrowedBySchema = new Schema({
  userName: {type: String, required: true},
  userEmail: String,
  userPhone: String,
  borrowedDate: {type: Date, default: Date.now},
  returnedDate: Date,
}, {_id: false});

const ProductSchema = new Schema({
  title: {type:String, required:true},
  description: String,
  author: String,
  isbn: String,
  publisher: String,
  publishedYear: Number,
  images: [{type:String}],
  category: {type:mongoose.Types.ObjectId, ref:'Category'},
  properties: {type:Object},
  stock: {type: Number, default: 0},
  status: {type: String, enum: ['available', 'borrowed'], default: 'available'},
  borrowedBy: [BorrowedBySchema],
}, {
  timestamps: true,
});

export const Product = models.Product || model('Product', ProductSchema);