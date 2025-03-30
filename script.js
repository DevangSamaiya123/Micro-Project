var jpdbBaseURL = "http://api.login2explore.com:5577";
var jpdbIML = "/api/iml";
var jpdbIRL = "/api/irl";
var shipmentDBName = "DELIVERY-DB";
var shipmentRelName = "SHIPMENT-TABLE";
var connToken = "90934290|-31949202296413862|90957698";

$(document).ready(function() {
    initializeForm();
    
    $("#shipmentNo").on('blur', checkShipmentExists);
    $("#save").on('click', saveShipment);
    $("#update").on('click', updateShipment);
    $("#reset").on('click', resetForm);
});

function initializeForm() {
    $("#shipmentNo").val('');
    $("#description").val('');
    $("#source").val('');
    $("#destination").val('');
    $("#shippingDate").val('');
    $("#expectedDeliveryDate").val('');
    $("#shipmentNo").prop("disabled", false).focus();
    $("#description, #source, #destination, #shippingDate, #expectedDeliveryDate").prop("disabled", true);
    $("#save, #update, #reset").prop("disabled", true);
    $("#reset").prop("disabled", false);
}

function saveRecNoToLocalStorage(jsonObj) {
    try {
        var lvData = JSON.parse(jsonObj.data);
        localStorage.setItem("recno", lvData.rec_no);
    } catch (e) {
        console.error("Error in recno:", e);
    }
}

function getShipmentNoAsJsonObj() {
    var shipmentNo = $("#shipmentNo").val().trim(); // extra space remove krdega
    if (!shipmentNo) return null;
    
    return JSON.stringify({
        "shipment_no": shipmentNo
    });
}

function enableDataEntryFields() {
    $("#description, #source, #destination, #shippingDate, #expectedDeliveryDate").prop("disabled", false);
}

function resetForm() {

    $("#shipmentNo").val("");
    $("#description").val("");
    $("#source").val("");
    $("#destination").val("");
    $("#shippingDate").val("");
    $("#expectedDeliveryDate").val("");
    $("#shipmentNo").prop("disabled", false);
    $("#description, #source, #destination, #shippingDate, #expectedDeliveryDate").prop("disabled", true);
    $("#save, #update").prop("disabled", true);
    $("#reset").prop("disabled", true);
    $("#shipmentNo").focus();
}

function fillFormData(jsonObj) {
    try {
        saveRecNoToLocalStorage(jsonObj);
        var data = JSON.parse(jsonObj.data).record;
        
        $("#description").val(data.description);
        $("#source").val(data.source);
        $("#destination").val(data.destination);
        $("#shippingDate").val(data.shipping_date);
        $("#expectedDeliveryDate").val(data.expected_delivery_date);
    } catch (e) {
        console.error("Error filling form data:", e);
        alert("Error loading shipment data");
    }
}

function validateForm() {
    var fields = {
        shipmentNo: $("#shipmentNo").val().trim(),
        description: $("#description").val().trim(),
        source: $("#source").val().trim(),
        destination: $("#destination").val().trim(),
        shippingDate: $("#shippingDate").val(),
        expectedDeliveryDate: $("#expectedDeliveryDate").val()
    };
    var requiredFields = [
        { field: "shipmentNo", name: "Shipment No.", element: "#shipmentNo" },
        { field: "description", name: "Description", element: "#description" },
        { field: "source", name: "Source", element: "#source" },
        { field: "destination", name: "Destination", element: "#destination" },
        { field: "shippingDate", name: "Shipping Date", element: "#shippingDate" },
        { field: "expectedDeliveryDate", name: "Expected Delivery Date", element: "#expectedDeliveryDate" }
    ];

    for (var i = 0; i < requiredFields.length; i++) {
        var field = requiredFields[i];
        if (!fields[field.field]) {
            alert(field.name + " is required!");
            $(field.element).focus();
            return null;
        }
    }

    if (new Date(fields.expectedDeliveryDate) <= new Date(fields.shippingDate)) {
        alert("Expected Delivery Date must be after Shipping Date!");
        $("#expectedDeliveryDate").focus();
        return null;
    }

    return {
        "shipment_no": fields.shipmentNo,
        "description": fields.description,
        "source": fields.source,
        "destination": fields.destination,
        "shipping_date": fields.shippingDate,
        "expected_delivery_date": fields.expectedDeliveryDate
    };
}

function checkShipmentExists() {
    var shipmentNoJson = getShipmentNoAsJsonObj();
    if (!shipmentNoJson) {
        resetForm();
        return;
    }

    var getRequest = createGET_BY_KEYRequest(connToken, shipmentDBName, shipmentRelName, shipmentNoJson);
    
    try {
        jQuery.ajaxSetup({ async: false });
        var resJsonObj = executeCommandAtGivenBaseUrl(getRequest, jpdbBaseURL, jpdbIRL);
        jQuery.ajaxSetup({ async: true });

        if (resJsonObj.status === 400) {
            enableDataEntryFields();
            $("#save").prop("disabled", false);
            $("#description").focus();
        } else if (resJsonObj.status === 200) {
            $("#shipmentNo").prop("disabled", true);
            fillFormData(resJsonObj);
            enableDataEntryFields();
            $("#update").prop("disabled", false);
            $("#save").prop("disabled",true);
            $("#reset").prop("disabled",false);
            $("#description").focus();
        }
    } catch (e) {
        console.error("Error checking shipment:", e);
        alert("Error checking shipment existence");
    }
}

function saveShipment() {
    var formData = validateForm();
    if (!formData) return;

    var putRequest = createPUTRequest(connToken, JSON.stringify(formData), shipmentDBName, shipmentRelName);
    
    try {
        jQuery.ajaxSetup({ async: false });
        var resJsonObj = executeCommandAtGivenBaseUrl(putRequest, jpdbBaseURL, jpdbIML);
        jQuery.ajaxSetup({ async: true });

        if (resJsonObj.status === 200) {
            alert("Shipment saved successfully!");
            resetForm();
        } else {
            alert("Error saving shipment: " + (resJsonObj.message || "Unknown error"));
        }
    } catch (e) {
        console.error("Error saving shipment:", e);
        alert("Error saving shipment");
    }
}

function updateShipment() {
    var formData = validateForm();
    if (!formData) return;

    var recno = localStorage.getItem("recno");
    if (!recno) {
        alert("No record selected for update");
        return;
    }

    var updateRequest = createUPDATERecordRequest(connToken, JSON.stringify(formData), shipmentDBName, shipmentRelName, recno);
    
    try {
        jQuery.ajaxSetup({ async: false });
        var resJsonObj = executeCommandAtGivenBaseUrl(updateRequest, jpdbBaseURL, jpdbIML);
        jQuery.ajaxSetup({ async: true });

        if (resJsonObj.status === 200) {
            alert("Shipment updated successfully!");
            resetForm();
        } else {
            alert("Error updating shipment: " + (resJsonObj.message || "Unknown error"));
        }
    } catch (e) {
        console.error("Error updating shipment:", e);
        alert("Error updating shipment");
    }
}

