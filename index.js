//import atau panggil package2 yg kita mau pakai di aplikasi kita
const express = require('express');
const path = require('path');
const { Op } = require('sequelize');

//manggil models/table disini
const{ product } = require('./models');

//yg membantu proses upload file
const imagekit = require('./lib/imagekit');
const upload = require('./middleware/uploader');

//framework express = frameworkk untuk http server
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//setting view engine
app.set("views", __dirname + "/views")
app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "public")))

app.get('/', (req,res) => {
    res.render("index", {
        title: "Challege Chapter 4"
    })
})

//ini untuk page lihat semua produk dari database
app.get('/admin/product', async (req,res) => {
    let products;

    if(req.query.filter) {
        products = await product.findAll({
            where: {
                size: {
                    [Op.substring]: req.query.filter
                }
            },
            order: [['id', 'ASC']]
        });
    } else {
        //get data dari database pake sequelize method findAll
        products = await product.findAll({
            order: [['id', 'ASC']]
        });
    }

    //proses akhir = response yg render ejs file kita
    res.render('products/index', {
        products
    })
})

//ini untuk render page create product
app.get('/admin/product/create', (req,res) => {
    res.render("products/create")
})

//ini untuk create data baru
app.post('/products', upload.single('image'), async (req,res) => {
    //req.file.image

    //request body = req.body.name
    const { name, price, stock, size } = req.body
    const file = req.file
    console.log(file);
    //untuk dapat extension file
    //image.jpg -> jpg itu extensionnya
    const split = file.originalname.split('.');
    const ext = split[split.length - 1];

    //proses upload file ke imagekit
    const img = await imagekit.upload({
        file: file.buffer,
        fileName: `IMG-${Date.now()}.${ext}`
    }).catch((err) => console.log(err))
    console.log(img);
    
    //proses insert atau create data yang dari request body ke DB/tabel
    //pake sequelize method create utk proses data baru ke tabel/modelnya
     await product.create({
        name,
        price,
        stock,
        size,
        imgUrl: img.url
    })

    //response redirect page
    res.redirect(201, "/admin/product")
})

//ini untuk render page edit product
app.get('/admin/product/edit/:id', async (req,res) => {
    //proses ambil detail product sesuai id yang di params
    const data = await product.findByPk(req.params.id)
    const productDetail = data.dataValues
    res.render("products/update", {
        productDetail,
        sizeOptions: ['small', 'medium', 'large']
    })
})

//ini untuk update product
app.post('/products/edit/:id', (req,res) => {
    //req.params.id
    //request body => req.body.name
    const { name, price, stock, size } = req.body
    const id = req.params.id

    //proses insert atau create data yang dari request body ke DB/tabel
    //pake sequelize method create utk proses data baru ke tabel/modelnya
    product.update({
        name,
        price,
        stock,
        size
    }, {
        where:{
            id
        }
    })

    //response redirect page
    res.redirect(200, "/admin/product")
})

//delete product 
app.get("/products/delete/:id", async (req,res) => {
    const id = req.params.id
    product.destroy({
        where: {
            id
        }
    })
    res.redirect(200, "/admin/product")
})

app.listen(PORT, () => {
    console.log(`App Running on localhost ${PORT}`)
})
