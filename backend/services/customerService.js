const fs = require("fs");
const path = require("path");

const FILE = path.join(

    __dirname,

    "../customers.json"

);

/* ==========================================
   Read
========================================== */

function getCustomers(){

    try{

        const data = fs.readFileSync(

            FILE,

            "utf8"

        );

        if(!data.trim()){

            return [];

        }

        return JSON.parse(data);

    }

    catch{

        return [];

    }

}

/* ==========================================
   Save
========================================== */

function saveCustomers(customers){

    fs.writeFileSync(

        FILE,

        JSON.stringify(

            customers,

            null,

            2

        )

    );

}

/* ==========================================
   Create Customer
========================================== */

function createCustomer(customer){

    const customers = getCustomers();

    const newCustomer = {

        id: Date.now(),

        createdAt: new Date().toISOString(),

        status: "Aktiv",

        ...customer

    };

    customers.push(newCustomer);

    saveCustomers(customers);

    return newCustomer;

}

/* ==========================================
   Get Customer By Id
========================================== */

function getCustomerById(id){

    const customers = getCustomers();

    return customers.find(

        customer =>

        customer.id == id

    );

}

/* ==========================================
   Update Customer
========================================== */

function updateCustomer(id,data){

    const customers = getCustomers();

    const index = customers.findIndex(

        customer =>

        customer.id == id

    );

    if(index === -1){

        throw new Error(

            "Customer not found"

        );

    }

    customers[index] = {

        ...customers[index],

        ...data,

        updatedAt:

        new Date().toISOString()

    };

    saveCustomers(customers);

    return customers[index];

}

/* ==========================================
   Delete Customer
========================================== */

function deleteCustomer(id){

    const customers = getCustomers();

    const filtered = customers.filter(

        customer =>

        customer.id != id

    );

    saveCustomers(filtered);

}
module.exports = {
    getCustomers,
    createCustomer,
    getCustomerById,
    updateCustomer,
    deleteCustomer
};
