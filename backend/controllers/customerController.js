const {

    getCustomers,
    createCustomer,
    getCustomerById,
    updateCustomer,
    deleteCustomer

} = require("../services/customerService");

/* ==========================================
   GET ALL CUSTOMERS
========================================== */

function getAll(req,res){

    try{

        res.json(getCustomers());

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

}

/* ==========================================
   GET CUSTOMER
========================================== */

function getOne(req,res){

    try{

        const customer = getCustomerById(req.params.id);

        if(!customer){

            return res.status(404).json({

                success:false,

                message:"Customer not found"

            });

        }

        res.json(customer);

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

}

/* ==========================================
   CREATE CUSTOMER
========================================== */

function create(req,res){

    try{

        const customer = createCustomer(req.body);

        res.status(201).json({

            success:true,

            customer

        });

    }

    catch(error){

        res.status(400).json({

            success:false,

            message:error.message

        });

    }

}

/* ==========================================
   UPDATE CUSTOMER
========================================== */

function update(req,res){

    try{

        const customer = updateCustomer(

            req.params.id,

            req.body

        );

        res.json({

            success:true,

            customer

        });

    }

    catch(error){

        res.status(400).json({

            success:false,

            message:error.message

        });

    }

}

/* ==========================================
   DELETE CUSTOMER
========================================== */

function remove(req,res){

    try{

        deleteCustomer(req.params.id);

        res.json({

            success:true

        });

    }

    catch(error){

        res.status(400).json({

            success:false,

            message:error.message

        });

    }

}

/* ==========================================
   EXPORTS
========================================== */

module.exports = {

    getAll,

    getOne,

    create,

    update,

    remove

};