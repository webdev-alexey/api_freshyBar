import express from 'express';
import { readFile, writeFile, access } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_FILE = 'db.json';
const ORDERS_FILE = 'orders.json';

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// GET /api/goods - возвращает данные из файла db.json
app.get('/api/goods', async (req, res) => {
  try {
    const data = await readFile(DB_FILE, 'utf8');
    const goods = JSON.parse(data);
    res.json(goods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /img/:filename - returns the image file with the given filename
app.get('/img/:filename', async (req, res) => {
  const { filename } = req.params;
  const imagePath = path.join(__dirname, 'img', filename);

  try {
    await access(imagePath);
    res.sendFile(imagePath);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: 'Image not found' });
  }
});

// POST /api/order - оформляет заказ с полями имя, телефон и массив с товарами
app.post('/api/order', async (req, res) => {
  const { name, phone, products } = req.body;

  // Проверка наличия обязательных полей
  if (!name || !phone || !products) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const order = { name, phone, products };

  try {
    // Чтение существующих заказов из файла
    const data = await readFile(ORDERS_FILE, 'utf8');
    const orders = JSON.parse(data);

    // Добавление нового заказа
    orders.push(order);

    // Запись обновленных заказов в файл
    await writeFile(ORDERS_FILE, JSON.stringify(orders));

    res.json({ message: 'Order placed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Проверка наличия файла db.json, и создание с пустым массивом, если файла нет
access(DB_FILE)
  .catch(() => writeFile(DB_FILE, '[]'))
  .catch(err => {
    console.error(err);
  });

access(ORDERS_FILE)
  .catch(() => writeFile(ORDERS_FILE, '[]'))
  .catch(err => {
    console.error(err);
  });

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
