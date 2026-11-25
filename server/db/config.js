const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);
// Con bufferCommands=false, la creación automática de colecciones/índices puede
// lanzar si un modelo se compila antes de que la conexión esté lista (crash loop
// al reiniciar). Se desactiva y los índices se sincronizan tras conectar.
mongoose.set('autoCreate', false);
mongoose.set('autoIndex', false);
const User = require('../model/schema/user');
const bcrypt = require('bcrypt');
const { initializeLeadSchema } = require("../model/schema/lead");
const { initializeContactSchema } = require("../model/schema/contact");
const { initializePropertySchema } = require("../model/schema/property");
const { createNewModule } = require("../controllers/customField/customField.js");
const { add: createNewRole } = require("../controllers/roleAccess/roleAccess.js");
const customField = require('../model/schema/customField.js');
const { contactFields } = require('./contactFields.js');
const { leadFields } = require('./leadFields.js');
const { propertiesFields } = require('./propertiesFields.js');
const { defaultRole } = require("./defaultRoles.js");
const { initFacebookScraperModule } = require("../controllers/facebookScraper/bootstrap.js");

const initializedSchemas = async () => {
    await initializeLeadSchema();
    await initializeContactSchema();
    await initializePropertySchema();

    const CustomFields = await customField.find({ deleted: false });
    const createDynamicSchemas = async (CustomFields) => {
        for (const module of CustomFields) {
            const { moduleName, fields } = module;

            // Check if schema already exists
            if (!mongoose.models[moduleName]) {
                // Create schema object
                const schemaFields = {};
                for (const field of fields) {
                    schemaFields[field.name] = { type: field.backendType };
                    if (field.ref) schemaFields[field.name] = { type: field.backendType, ref: field.ref };
                }
                // Create Mongoose schema
                const moduleSchema = new mongoose.Schema(schemaFields);
                // Create Mongoose model
                mongoose.model(moduleName, moduleSchema, moduleName);
                console.log(`Schema created for module: ${moduleName}`);
            }
        }
    };

    createDynamicSchemas(CustomFields);

}

const supabase = require('./supabaseClient');

const connectDB = async (DATABASE_URL, DATABASE) => {
    try {
        console.log("Connecting to Supabase Database...");
        
        // Check Supabase connection
        const { data: users, error } = await supabase.from('users').select('*').limit(1);
        if (error && error.code === 'PGRST205') {
            console.log("Supabase connected successfully! (Tables ready to be created via SQL schema).");
        } else if (error) {
            console.log("Supabase notice:", error.message);
        } else {
            console.log("Supabase Database Connected Successfully.");
        }

        // Seed Default SuperAdmin in Supabase
        const { data: existingAdmin, error: adminErr } = await supabase
            .from('users')
            .select('*')
            .eq('username', 'admin@gmail.com');

        if (!adminErr && existingAdmin && existingAdmin.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const { error: createErr } = await supabase.from('users').insert([
                {
                    username: 'admin@gmail.com',
                    password: hashedPassword,
                    first_name: 'Nova',
                    last_name: 'Admin',
                    phone_number: '7874263694',
                    role: 'superAdmin'
                }
            ]);

            if (createErr) {
                console.log("Supabase Admin creation info:", createErr.message);
            } else {
                console.log("Default SuperAdmin ('admin@gmail.com') created in Supabase!");
            }
        } else if (existingAdmin && existingAdmin.length > 0) {
            console.log("SuperAdmin 'admin@gmail.com' ready in Supabase.");
        }

        // Try Mongoose connection if MongoDB URL provided (graceful attempt)
        try {
            const mongoose = require('mongoose');
            if (DATABASE_URL) {
                mongoose.set("strictQuery", false);
                await mongoose.connect(DATABASE_URL, { dbName: DATABASE });
                console.log("MongoDB Mongoose layer initialized.");

                // Índices declarados en los esquemas (se crean de forma segura tras conectar)
                try {
                    await Promise.all(
                        Object.values(mongoose.models).map((model) =>
                            model.createIndexes().catch(() => null)
                        )
                    );
                } catch (indexError) {
                    console.log("Index sync info:", indexError.message);
                }

                // Seed default CustomFields if missing
                const CustomField = require('../model/schema/customField.js');
                const modulesToSeed = [
                    { moduleName: 'Properties', fields: propertiesFields, no: 1 },
                    { moduleName: 'Contacts', fields: contactFields, no: 2 },
                    { moduleName: 'Leads', fields: leadFields, no: 3 }
                ];

                for (const m of modulesToSeed) {
                    const existing = await CustomField.findOne({ moduleName: m.moduleName });
                    if (!existing) {
                        await CustomField.create({
                            moduleName: m.moduleName,
                            fields: m.fields,
                            headings: [],
                            no: m.no,
                            createdDate: new Date(),
                            deleted: false
                        });
                        console.log(`Default CustomField module '${m.moduleName}' seeded.`);
                    }
                }
                await initializedSchemas();
                await initFacebookScraperModule();
            }
        } catch (mErr) {
            console.log("Mongoose secondary layer skipped/info:", mErr.message);
        }

    } catch (err) {
        console.log("Database connection error:", err.message);
    }
}

module.exports = connectDB;