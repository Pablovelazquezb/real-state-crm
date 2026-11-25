const customField = require('../../model/schema/customField');
const RoleAccess = require('../../model/schema/roleAccess');

const index = async (req, res) => {
    try {
        const query = req.query;
        query.deleted = false;
        let result = await customField.find(query);
        result.sort((a, b) => {
            return a.no - b.no;
        });

        let response = result.map((item) => ({
            _id: item._id,
            updatedDate: item.updatedDate,
            deleted: item.deleted,
            moduleName: item.moduleName,
            icon: item.icon,
            createdDate: item.createdDate
        }));

        // Los usuarios del CRM viven en Supabase (id UUID): no se consultan en Mongo,
        // así se evita el CastError que rompía esta ruta para los empleados.
        return res.status(200).json(response);

    } catch (err) {
        console.error('Error :', err);
        return res.status(400).json({ err, error: 'Something wents wrong' });
    }
}

module.exports = { index }