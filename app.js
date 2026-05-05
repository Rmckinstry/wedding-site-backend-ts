import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js'

const app = express();
const port = 3001;

app.use(cors());

/* Will build out later when connecting UI and service
const corsOptions = {
  origin: '',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 204,
};
*/

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// central router from routes/index.js
app.use('/', routes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})