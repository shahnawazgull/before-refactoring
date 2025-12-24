import express from 'express';
import mongoose from "mongoose";
import multer from 'multer';
import path from 'path';

const app = express();

app.set('view engine','ejs');
app.use(express.static('images'));
app.use(express.urlencoded({extended:true}));

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

const temp = mongoose.model("SNKPRODUCTS", productsSchema);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images')
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

const ul = multer({
    storage,
    limits,
    fileFilter
});

export default ul;

const conn = () => {
    try {
        mongoose.connect('mongodb://localhost:27017/SNKPRODUCTS');
        console.log(`db connected successfully`)
    } catch (e) {
        console.log(`db connection failed due to ${e}`)
    }
};

conn();

app.get('/', async (req, res) => {
    const products = await temp.find();
    res.render('index', { products })
});

app.get('/add-product', (req, res) => {
    res.render('addProduct')
});

app.post('/add-product', ul.single('image'), async (req, res) => {
    try {
        await temp.create({
            product_name: req.body.product_name,
            category: req.body.product_cat,
            price: req.body.price,
            quantity: req.body.product_quantity,
            supplier: req.body.supplier_name,
            stock_status: req.body.stock,
            image: req.file ? req.file.filename : null,
            description: req.body.product_desc,
        });
        res.redirect('/')
    } catch (e) {
        console.log(e)
        res.render('addProduct')
    }
});

app.get('/edit-product/:id', async (req, res) => {
    const product = await temp.findById(req.params.id)
    res.render('editProduct', { p: product })
});

app.post('/edit-product/:id', ul.single('image'), async (req, res) => {
    const product = await temp.findById(req.params.id)
    try {
        const updatedData = {
            product_name: req.body.product_name,
            category: req.body.product_cat,
            price: req.body.price,
            quantity: req.body.product_quantity,
            supplier: req.body.supplier_name,
            stock_status: req.body.stock,
            description: req.body.product_desc,
        }
        if (product) {
            if (req.file) {
                updatedData.image = req.file.filename;
            }
            await temp.findByIdAndUpdate(req.params.id, updatedData);
            res.redirect('/')
        }
    } catch (e) {
        console.log(e)
        res.render('editProduct', { p: product })
    }
});

app.get('/delete-product/:id', async (req, res) => {
    const product = await temp.findById(req.params.id);
    if (product != null) {
        await temp.findByIdAndDelete(product);
        res.redirect('/')
    } else {
        console.log('no product found with this id')
    }
});

app.use((req, res) => {
    res.status(404).render('404page')
});

const port = 8080;
app.listen(port, () => {
    console.log(`server is running at http://localhost:${port}`);
});
