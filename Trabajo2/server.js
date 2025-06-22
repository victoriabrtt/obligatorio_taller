const express = require('express');
const path = require('path');
const app = express();

// Servir archivos estáticos desde la carpeta 'web'
app.use(express.static(path.join(__dirname, 'web')));

// Ruta para la página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

// Puerto para el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`Sirviendo archivos desde: ${path.join(__dirname, 'web')}`);
});
