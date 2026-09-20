'use strict';

const express = require('express');
require('dotenv').config();


const port = process.env.PORT || 3000;



const app = express();
app.use(express.json());

app.use((req, res) => res.status(404).json({ error: { message: 'Unknown route.' } }));


app.listen(port, () => console.log(`App runing on :${port}`));



