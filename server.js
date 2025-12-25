// original-legacy-server.js
// BEFORE REFACTORING - Monolithic, messy, legacy-style Express app

import express from 'express';
import mongoose from "mongoose";
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config(); // Note: .env not used consistently below

const app = express();
app.set('view engine','ejs');

// Bad: serving only 'images' instead of full 'public' folder
app.use(express.static('images'));

app.use(express.urlencoded({extended:true}));

// Schema defined inline with no separation
const productsSchema = new mongoose.Schema(
{
  product_name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  supplier: {
    type: String,
    required: true,
    trim: true,
  },
  stock_status: {
    type: String,
    enum: ["In Stock", "Low Stock", "Out of Stock"],
    default: "In Stock",
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  image: {
    type: String
  },
  is_active: {
    type: Boolean,
    default: true,
  },
},
{
  timestamps: true,
}
);

// Poor naming: 'temp' instead of meaningful model name
const temp = mongoose.model("BEFOREREFACTOREDDB", productsSchema);

// Multer configuration scattered and poorly named
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images') // Note: but static serves only 'images'!
  },
  filename: function (req, file, cb) {
    const newFileName = Date.now() + path.extname(file.originalname)
    cb(null, newFileName)
  }
});

const limits = {
  fileSize: 5 * 1024 * 1024
};

const fileFilter = function (req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    return cb(null, true)
  } else {
    return cb(new Error('only images are allowed'), false)
  }
};

// Bad variable name: 'ul' for upload
const ul = multer({
  storage,
  limits,
  fileFilter
});

// DB connection hardcoded, no env usage despite importing dotenv
const conn = () => {
  try {
    mongoose.connect('mongodb://localhost:27017/BEFOREREFACTOREDDB'); // hardcoded!
    console.log(`db connected successfully`)
  } catch (e) {
    console.log(`db connection failed due to ${e}`)
  }
};
conn();

// Long, complex route handlers with duplicated logic
app.get('/', async (req, res) => {
  const products = await temp.find(); // vague variable name
  res.render('index', { products })
});

app.get('/add-product', (req, res) => {
  res.render('addProduct')
});

app.post('/add-product', ul.single('image'), async (req, res) => {
  try {
    // Temporary object not necessary - could pass directly
    const tempProductData = {
      product_name: req.body.product_name,
      category: req.body.product_cat,
      price: req.body.price,
      quantity: req.body.product_quantity,
      supplier: req.body.supplier_name,
      stock_status: req.body.stock,
      image: req.file ? req.file.filename : null,
      description: req.body.product_desc,
    };

    await temp.create(tempProductData);
    res.redirect('/')
  } catch (e) {
    console.log(e)
    res.render('addProduct')
  }
});

app.get('/edit-product/:id', async (req, res) => {
  const product = await temp.findById(req.params.id)
  res.render('editProduct', { p: product }) // 'p' is not descriptive
});

app.post('/edit-product/:id', ul.single('image'), async (req, res) => {
  const product = await temp.findById(req.params.id)
  try {
    // Unnecessary temp object with long parameter list
    let updatedData = {
      product_name: req.body.product_name,
      category: req.body.product_cat,
      price: req.body.price,
      quantity: req.body.product_quantity,
      supplier: req.body.supplier_name,
      stock_status: req.body.stock,
      description: req.body.product_desc,
    }

    if (req.file) {
      updatedData.image = req.file.filename;
    }

    // Redundant null check (findById already returned product)
    if (product != null) {
      await temp.findByIdAndUpdate(req.params.id, updatedData);
      res.redirect('/')
    } else {
      console.log('product not found') // dead code path
    }
  } catch (e) {
    console.log(e)
    res.render('editProduct', { p: product })
  }
});

app.get('/delete-product/:id', async (req, res) => {
  const product = await temp.findById(req.params.id);
  
  // Bug: deleting wrong object! Should use req.params.id
  if (product != null) {
    await temp.findByIdAndDelete(product); // Wrong! Passing document instead of ID
    res.redirect('/')
  } else {
    console.log('no product found with this id')
  }
});

// 404 handler at the end
app.use((req, res) => {
  res.status(404).render('404page')
});

// Hardcoded port
const port = 8080;
app.listen(port, () => {
  console.log(`server is running at http://localhost:${port}`);
});