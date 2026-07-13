const {
    getAllLeads,
    saveLead,
    updateLeadById,
    deleteLeadById
} = require("../services/leadService");

const log = require("../services/logService");

async function getLeads(req, res) {

    try {

        const leads = getAllLeads();

        log.info(`Leads loaded (${leads.length})`);

        res.json(leads);

    } catch (error) {

        log.error(`Get leads failed: ${error.message}`);

        res.status(500).json({

            success: false,
            error: error.message

        });

    }

}

async function createLead(req, res) {

    try {

        const lead = await saveLead(req.body);

        log.info(
            `Lead created: ${lead.name} (${lead.email})`
        );

        res.json({

            success: true,
            lead

        });

    } catch (error) {

        log.error(`Create lead failed: ${error.message}`);

        res.status(500).json({

            success: false,
            error: error.message

        });

    }

}

async function updateLead(req, res) {

    try {

        updateLeadById(
            req.params.id,
            req.body
        );

        log.info(
            `Lead updated: ${req.params.id}`
        );

        res.json({

            success: true

        });

    } catch (error) {

        log.error(`Update lead failed: ${error.message}`);

        res.status(500).json({

            success: false,
            error: error.message

        });

    }

}

async function deleteLead(req, res) {

    try {

        deleteLeadById(req.params.id);

        log.info(
            `Lead deleted: ${req.params.id}`
        );

        res.json({

            success: true

        });

    } catch (error) {

        log.error(`Delete lead failed: ${error.message}`);

        res.status(500).json({

            success: false,
            error: error.message

        });

    }

}

module.exports = {

    getLeads,
    createLead,
    updateLead,
    deleteLead

};