const mongoose=require("mongoose");
const categorySchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String
    },
    image:{
        type:String,
    },
    attributes:{
        type:Map,
        of:String
    },
    parentCategory:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category',
        default:null
    },
    isParent:{
        type:Boolean,
        default:true 
    },
    seoTitle:{
        type:String
    },
    seoDescription:{
        type:String
    },
});

categorySchema.pre("save", function (next) {
    if (!this.seoTitle) {
      this.seoTitle = `${this.name} - Best ${this.name} Category`; 
    }
    if (!this.seoDescription) {
      this.seoDescription = this.description
        ? this.description.substring(0, 150)
        : `Explore the best ${this.name} products and services.`;
    }
    next();
  });
  
  const Category = mongoose.model("Category", categorySchema);
  
  module.exports = Category;