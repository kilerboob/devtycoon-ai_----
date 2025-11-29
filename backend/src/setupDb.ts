import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const getClient = (dbName: string) => {
    return new Client({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: dbName,
        password: process.env.DB_PASSWORD || 'password',
        port: parseInt(process.env.DB_PORT || '5432'),
    });
};

const setup = async () => {
    const targetDbName = process.env.DB_NAME || 'devtycoon_angverse';

    console.log('🔌 Connecting to postgres database to check existence of target DB...');
    const sysClient = getClient('postgres');

    try {
        await sysClient.connect();
        const res = await sysClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDbName]);

        if (res.rowCount === 0) {
            console.log(`✨ Database ${targetDbName} does not exist. Creating...`);
            await sysClient.query(`CREATE DATABASE "${targetDbName}"`);
            console.log('✅ Database created.');
        } else {
            console.log(`ℹ️ Database ${targetDbName} already exists.`);
        }
    } catch (e: any) {
        console.error('❌ Error checking/creating database:', e.message);
        process.exit(1);
    } finally {
        await sysClient.end();
    }

    console.log(`🔌 Connecting to ${targetDbName}...`);
    const dbClient = getClient(targetDbName);

    try {
        await dbClient.connect();

        // Read init.sql
        const sqlPath = path.join(__dirname, '../sql/init.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log('📜 Running init.sql...');
        await dbClient.query(sqlContent);
        console.log('✅ Global schema and functions initialized.');

        console.log('💎 Creating shard "node_01"...');
        await dbClient.query("SELECT create_node_shard('node_01')");
        console.log('✅ Shard "node_01" created successfully.');

    } catch (e: any) {
        console.error('❌ Error running setup:', e.message);
    } finally {
        await dbClient.end();
    }
};

setup();
