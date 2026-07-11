import { PrismaClient } from '@prisma/client';

// Single shared PrismaClient instance for the whole app.
// Creating a new client per request would exhaust database connections.
const prisma = new PrismaClient();

export default prisma;
