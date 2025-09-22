// functions/get-quote-details.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    const quoteId = event.queryStringParameters.id;
    if (!quoteId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No se proporcionó un ID de cotización.' }) };
    }

    const USERNAME = process.env.TOURSYS_API_USER;
    const PASSWORD = process.env.TOURSYS_API_PASSWORD;
    const API_URL = `http://k8s-cloud1.toursys.net/api/v2/quotes/${quoteId}`;

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
            return { statusCode: response.status, body: JSON.stringify({ error: `Error de la API de Toursys para el ID ${quoteId}: ${response.statusText}`, details: errorText }) };
        }

        const data = await response.json();
        return { statusCode: 200, body: JSON.stringify(data) };

    } catch (error) {
        console.error("Error en get-quote-details:", error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error interno al obtener los detalles.' }) };
    }
};


