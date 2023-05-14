'use strict';

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1:27017/tesla-wallconnector');

var exports = module.exports = {};

exports.disconnect = mongoose.disconnect;

const vitals = new mongoose.Schema({
    contactor_closed: {
        type: Boolean,
        required: true,
    },
    vehicle_connected: {
        type: Boolean,
        required: true,
    },
    session_s: {
        type: Number,
        required: true,
    },
    grid_v: {
        type: Number,
        required: true,
    },
    grid_hz: {
        type: Number,
        required: true,
    },
    vehicle_current_a: {
        type: Number,
        required: true,
    },
    currentA_a: {
        type: Number,
        required: true,
    },
    currentB_a: {
        type: Number,
        required: true,
    },
    currentC_a: {
        type: Number,
        required: true,
    },
    currentN_a: {
        type: Number,
        required: true,
    },
    voltageA_v: {
        type: Number,
        required: true,
    },
    voltageB_v: {
        type: Number,
        required: true,
    },
    voltageC_v: {
        type: Number,
        required: true,
    },
    relay_coil_v: {
        type: Number,
        required: true,
    },
    pcba_temp_c: {
        type: Number,
        required: true,
    },
    handle_temp_c: {
        type: Number,
        required: true,
    },
    mcu_temp_c: {
        type: Number,
        required: true,
    },
    uptime_s: {
        type: Number,
        required: true,
    },
    input_thermopile_uv: {
        type: Number,
        required: true,
    },
    prox_v: {
        type: Number,
        required: true,
    },
    pilot_high_v: {
        type: Number,
        required: true,
    },
    pilot_low_v: {
        type: Number,
        required: true,
    },
    session_energy_wh: {
        type: Number,
        required: true,
    },
    config_status: {
        type: Number,
        required: true,
    },
    evse_state: {
        type: Number,
        required: true,
    },
    current_alerts: {
        type: [String],
        required: true,
    },
}, {
    autoCreate: true,
    timestamps: true,
});
vitals.index({ symbol: 1, date: -1}, { unique: true });
exports.Vitals = mongoose.model('Vitals', vitals);

/*
contactor_cycles: 56,
contactor_cycles_loaded: 0,
alert_count: 293,
thermal_foldbacks: 0,
avg_startup_temp: 25.3,
charge_starts: 56,
energy_wh: 343501,
connector_cycles: 15,
uptime_s: 381565,
charging_time_s: 124753
*/
const lifetime = new mongoose.Schema({
    contactor_cycles: {
        type: Number,
        required: true,
    },
    contactor_cycles_loaded: {
        type: Number,
        required: true,
    },
    alert_count: {
        type: Number,
        required: true,
    },
    thermal_foldbacks: {
        type: Number,
        required: true,
    },
    avg_startup_temp: {
        type: Number,
        required: true,
    },
    charge_starts: {
        type: Number,
        required: true,
    },
    energy_wh: {
        type: Number,
        required: true,
    },
    connector_cycles: {
        type: Number,
        required: true,
    },
    uptime_s: {
        type: Number,
        required: true,
    },
    charging_time_s: {
        type: Number,
        required: true,
    },
}, {
    autoCreate: true,
    timestamps: true,
});
lifetime.index({ symbol: 1, date: -1}, { unique: true });
exports.Lifetime = mongoose.model('Lifetime', lifetime);
