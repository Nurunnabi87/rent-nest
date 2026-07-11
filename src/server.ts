import app from './app';
import config from './config';

const main = () => {
  app.listen(config.port, () => {
    console.log(`🏠 RentNest API is running on port ${config.port}`);
  });
};

main();
