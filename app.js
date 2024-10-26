const express = require('express')
const bodyParser = require('body-parser')
const mustacheExpress = require('mustache-express')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const productos = require('./productos')
const app = express()

app.engine('html', mustacheExpress())
app.set('view engine', 'html')
app.set('views', __dirname + '/templates')

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())

const llaveSecreta =  "esteSecretoQueTienesConmigoNadieLoSabra"

const usuarios = [
        {
                usuario: "ecavero",
                clave: "ecavero",
                nombre: "Eduardo Cavero",
                acceso: ~0
        },
        {
                usuario: "jprice",
                clave: "jprice",
                nombre: "Johana Price",
                acceso: 1
        }
]

const verificarToken = (req, res, next) => {
        const token = req.cookies.token
        if (!token) {
                return res.status(403).render('error', {mensaje: "Token no proporcionado"})
        }

        jwt.verify(token, llaveSecreta, (err, decoded) => {
                if (err) {
                        return res.status(401).render('error', {mensaje: "Token inválido o expirado"})
                }
                req.usuario = decoded.usuario
                next()
        })
}

app.get('/', (req, res) => {
        res.sendFile(__dirname + '/public/login.html')
})

app.get('/menu', verificarToken, (req, res) => {
        console.log(req.usuario)
        res.render("menu", {usuario: req.usuario})
})

app.get('/productos', verificarToken, (req, res) => {
        res.render("productos", {productos: productos})
})

app.get('/error', (req, res) => {
        res.render("error")
})

app.post('/api/loguear', (req, res) => {
        const usuario = {usuario: req.body.usuario, clave: req.body.clave}
        const usuarioValido = usuarios.find((u) => u.usuario === usuario.usuario && u.clave === usuario.clave)
        if (usuarioValido) {
                const token = jwt.sign({usuario: usuarioValido}, llaveSecreta, {expiresIn: '10s'})
                console.log(token)
                res.cookie('token', token, {httpOnly: true, secure: true})
                res.redirect("/menu")
        } else {
                console.log(usuario)
                console.log(usuarioValido)
                return res.status(401).render('error', {mensaje: "Usuario no válido"})
        }
})

app.post('/api/productos', (req, res) => {
        res.setHeader('HX-Redirect', '/productos')
        res.status(200).end()
})


const port = 8080
app.listen(port, () => {
        console.log(`Servidor iniciado en http://localhost:${port}`)
})
