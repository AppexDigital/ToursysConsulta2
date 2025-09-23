const fetch = require('node-fetch');

const TOURSYS_USER = process.env.TOURSYS_USER;
const TOURSYS_PASS = process.env.TOURSYS_PASS;
// Aseguramos que la URL base no tenga un slash al final para una construcción predecible.
const API_BASE_URL = process.env.TOURSYS_API_URL.replace(/\/$/, "");

/**
 * Construye una URL de forma segura, evitando problemas de dobles slashes.
 * @param {string} path La ruta del endpoint.
 * @returns {string} La URL completa y correcta.
 */
function buildUrl(path) {
    return `${API_BASE_URL}${path}`;
}

async function getAuthToken() {
    const authUrl = buildUrl('/ToursysConnectionApi/api/auth/jwt');
    const response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userName: TOURSYS_USER,
            password: TOURSYS_PASS,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Error de autenticación desde ${authUrl}:`, errorBody);
        throw new Error(`Fallo en la autenticación con la API de Toursys. Status: ${response.status}. Respuesta: ${errorBody}`);
    }

    const data = await response.json();
    return data.generatedToken;
}

exports.handler = async (event, context) => {
    try {
        const token = await getAuthToken();
        const quotationsUrl = buildUrl('/ToursysConnectionApi/api/quotations/all');
        
        const response = await fetch(quotationsUrl, {
            method: 'GET',
            headers: { 'X-API-KEY': token },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Error al obtener cotizaciones desde ${quotationsUrl}:`, errorBody);
            throw new Error(`Error al obtener cotizaciones. Status: ${response.status}. Respuesta: ${errorBody}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};


