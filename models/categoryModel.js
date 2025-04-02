const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    image: {
      type: String
    },
    attributes: {
      type: Map,
      of: String
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null
    },
    isParent: {
      type: Boolean,
      default: true
    },
    discountPercentage: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    tags: {
      type: [String],
      default: []
    },
    seoTitle: {
      type: String
    },
    seoDescription: {
      type: String
    },
    isVisible: {
      type: Boolean,
      default: false
    },
    isHomePageVisible: {
      type: Boolean,
      default: false
    },
    isSpecial: {
      type: Boolean,
      default: false
    },
    isNew: {
      type: Boolean,
      default: false
    },
    isSale: {
      type: Boolean,
      default: false
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isBestseller: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);


categorySchema.pre("save", function (next) {
 
  if (!this.seoTitle || this.seoTitle.trim() === "") {
    this.seoTitle = `${this.name} - Best ${this.name} Category`;
  } else {
    this.seoTitle = this.seoTitle.trim();
  }


  if (!this.seoDescription) {
    this.seoDescription = this.description
      ? this.description.substring(0, 150)
      : `Explore the best ${this.name} products and services.`;
  }

 
  if (typeof this.tags === "string") {
    this.tags = this.tags
      .split(",")
      .map(tag => tag.trim()) 
      .filter(tag => tag.length > 0); 
  }

  next();
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
