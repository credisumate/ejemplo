const http = require('http');
const fs = require('fs');
const path = require('path');
const { Client } = require('cassandra-driver');
const querystring = require('querystring');
const ejs = require('ejs');




const PORT = 5500;
const publicPath = path.join(__dirname, 'Fronttienda');

const cassandraClient = new Client({
  contactPoints: ['127.0.0.1'], // Aquí debes poner la dirección IP o el hostname de tu cluster de Cassandra
  localDataCenter: 'datacenter1', // Aquí debes poner el nombre de tu datacenter (si no sabes cuál es, deja 'datacenter1')
  keyspace: 'tienda' // Aquí debes poner el nombre de tu keyspace
});

cassandraClient.connect((error) => {
  if (error) {
    console.error('Error al conectar con Cassandra', error);
  } else {
    console.log('Conexión exitosa con Cassandra');
  }
});


//insert
const server = http.createServer((req, res) => {
  const filePath = path.join(publicPath, req.url === '/' ? 'post.html' : req.url);
  const extname = path.extname(filePath);


  let contentType = 'text/html';
  switch (extname) {
    case '.html':
      contentType = 'text/html';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    // Agrega cualquier otro tipo de archivo que desees servir aquí
  }


 //insert
  if (req.method === 'POST' && req.url === '/post') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const data = querystring.parse(body);
      const query = 'INSERT INTO inventario (id, nombrep, descripcionp, precio, cantidad) VALUES (?, ?, ?, ?, ?)';
      const params = [data.id, data.nombrep, data.descripcionp, data.precio, data.cantidad];
      cassandraClient.execute(query, params, (error, result) => {
        if (error) {
          console.error('Error al insertar datos en Cassandra', error);
          console.log(data);
          res.writeHead(500);
          res.end('Error al insertar datos en Cassandra');
        } else {
          console.log('Datos insertados en Cassandra', result);
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Datos insertados correctamente en Cassandra');
        }
      });
    });
  } else {
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          res.writeHead(404);
          res.end('404 Not Found');
        } else {
          res.writeHead(500);
          res.end(`Error: ${error.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  }



  //select
  // consulta
if (req.method === 'GET' && req.url === '/consul') {
  const query = 'SELECT * FROM inventario';
  cassandraClient.execute(query, (error, result) => {
    if (error) {
      console.error('Error al consultar datos en Cassandra', error);
      res.writeHead(500);
      res.end('Error al consultar datos en Cassandra');
    } else {
      console.log('Datos consultados en Cassandra', result);
      const rows = result.rows;
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Consulta de datos</title>
          <link rel="stylesheet" type="text/css" href="./estilos.css">
        </head>
        <body>
          <h1>Consulta de datos</h1>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripcion</th>
                <th>Precio</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
      `;
      rows.forEach(row => {
        html += `
          <tr>
            <td>${row.id}</td>
            <td>${row.nombrep}</td>
            <td>${row.descripcionp}</td>
            <td>${row.precio}</td>
            <td>${row.cantidad}</td>
          </tr>
        `;
      });
      html += `
            </tbody>
          </table>
        </body>
        </html>
      `;
      fs.writeFile(path.join(publicPath, 'consul.html'), html, (error) => {
        if (error) {
          console.error('Error al guardar archivo HTML', error);
          res.writeHead(500);
          res.end('Error al guardar archivo HTML');
        } else {
          console.log('Archivo HTML generado exitosamente');
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Archivo HTML generado exitosamente');
        }
      });
    }
  });
}




//delete
if (req.method === 'POST' && req.url === '/eliminar') {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });
  req.on('end', () => {
    const data = querystring.parse(body);
    const query = 'DELETE FROM inventario WHERE id = ?';
    const params = [data.id];
    cassandraClient.execute(query, params, (error, result) => {
      if (error) {
        console.error('Error al eliminar datos en Cassandra', error);
        console.log(data);
        res.writeHead(500);
        res.end('Error al eliminar datos en Cassandra');
      } else {

        console.log('Datos eliminados en Cassandra', result);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Datos eliminados correctamente en Cassandra');

      }
    });
  });
}else {

}


if (req.method === 'POST' && req.url === '/update') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const data = querystring.parse(body);
      const query = 'UPDATE inventario SET nombrep = ?, descripcionp = ?, precio = ?, cantidad = ? WHERE id = ?';
      const params = [data.nombrep, data.descripcionp, data.precio, data.cantidad, data.id];
      cassandraClient.execute(query, params, (error, result) => {
        if (error) {
          console.error('Error al actualizar datos en Cassandra', error);
          console.log(data);
          res.writeHead(500);
          res.end('Error al actualizar datos en Cassandra');
        } else {
          console.log('Datos actualizados en Cassandra', result);
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Datos actualizados correctamente en Cassandra');
        }
      });
    });
  } 



});











server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
