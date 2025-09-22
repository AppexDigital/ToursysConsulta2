// functions/get-services.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    const USERNAME = process.env.TOURSYS_API_USER;
    const PASSWORD = process.env.TOURSYS_API_PASSWORD;
    const API_URL = 'http://k8s-cloud1.toursys.net/api/v2/products';

    if (!USERNAME || !PASSWORD) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Error de configuración del servidor.' }) };
    }

    try {
        const credentials = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { statusCode: response.status, body: JSON.stringify({ error: `Error al obtener el catálogo: ${response.statusText}`, details: errorText }) };
        }

        const data = await response.json();
        // **CORRECCIÓN CLAVE:** La API devuelve un objeto { products: [...] }. Devolvemos solo el array.
        return { statusCode: 200, body: JSON.stringify(data.products || []) };

    } catch (error) {
        console.error("Error en get-services:", error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error interno al obtener los servicios.' }) };
    }
};



