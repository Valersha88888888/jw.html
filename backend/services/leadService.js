const fs = require("fs");
const path = require("path");

const leadsFile = path.join(__dirname, "../leads.json");

function getAllLeads() {

    if (!fs.existsSync(leadsFile)) {
        return [];
    }

    const data = fs.readFileSync(leadsFile, "utf8");

    return data ? JSON.parse(data) : [];

}

function saveAllLeads(leads) {

    fs.writeFileSync(
        leadsFile,
        JSON.stringify(leads, null, 2)
    );

}

function saveLead(lead) {

    const leads = getAllLeads();

    const newLead = {

        id: Date.now(),

        createdAt: new Date().toISOString(),

        status: "Ny",

        ...lead

    };

    leads.push(newLead);

    saveAllLeads(leads);

    return newLead;

}

function updateLeadById(id, updatedData) {

    const leads = getAllLeads();

    const index = leads.findIndex(
        lead => lead.id == id
    );

    if (index === -1) {
        throw new Error("Lead not found");
    }

    leads[index] = {
        ...leads[index],
        ...updatedData
    };

    saveAllLeads(leads);

}

function deleteLeadById(id) {

    const leads = getAllLeads();

    const filtered = leads.filter(
        lead => lead.id != id
    );

    saveAllLeads(filtered);

}
function generateOfferNumber() {

    const year = new Date().getFullYear();

    const timestamp = Date.now().toString().slice(-6);

    return `JW-${year}-${timestamp}`;

}
module.exports = {

    getAllLeads,
    saveLead,
    updateLeadById,
    deleteLeadById,
    generateOfferNumber

};