const fetch = require('node-fetch');

const TOURSYS_USER = process.env.TOURSYS_USER;
const TOURSYS_PASS = process.env.TOURSYS_PASS;
const API_BASE_URL = process.env.TOURSYS_API_URL.replace(/\/$/, "");

function buildUrl(path) {
    return `${API_BASE_URL}${path}`;
}

async function getAuthToken() {
    const authUrl = buildUrl('/ToursysConnectionApi/api/auth/jwt');
    const response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: TOURSYS_USER, password: TOURSYS_PASS }),
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
        const { id } = event.queryStringParameters;
        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'El ID de la cotización es requerido.' }),
            };
        }

        const token = await getAuthToken();
        
        const quoteUrl = buildUrl(`/ToursysConnectionApi/api/quotations/${id}`);
        const quoteResponse = await fetch(quoteUrl, {
            headers: { 'X-API-KEY': token },
        });

        if (!quoteResponse.ok) {
            const errorBody = await quoteResponse.text();
            throw new Error(`Error al obtener datos de la cotización desde ${quoteUrl}. Status: ${quoteResponse.status}. Respuesta: ${errorBody}`);
        }
        const quoteData = await quoteResponse.json();

        const linesUrl = buildUrl(`/ToursysConnectionApi/api/quotationLines/${id}&es`);
        const linesResponse = await fetch(linesUrl, {
             headers: { 'X-API-KEY': token },
        });

        if (!linesResponse.ok) {
            const errorBody = await linesResponse.text();
            throw new Error(`Error al obtener líneas de servicio desde ${linesUrl}. Status: ${linesResponse.status}. Respuesta: ${errorBody}`);
        }
        const linesData = await linesResponse.json();

        const fullDetail = {
            ...quoteData,
            serviceLines: linesData
        };

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fullDetail),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

