import app from './app';

const PORT = process.env.PORT || 1000;

app.listen(PORT, () => console.log(`⚡️[server]: Server is running on port ${PORT}`));