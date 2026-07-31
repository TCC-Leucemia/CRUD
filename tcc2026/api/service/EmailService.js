const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const nodemailer = require("nodemailer");

module.exports = class EmailService {

    constructor() {

        this.transporter = nodemailer.createTransport({

            service: "gmail",

            auth: {

                user: process.env.EMAIL_USER,

                pass: process.env.EMAIL_PASS

            }

        });

    }

    async enviarCodigo(email, codigo) {

        await this.transporter.sendMail({

            from: `"HematoAI" <${process.env.EMAIL_USER}>`,

            to: email,

            subject: "Recuperação de senha - HematoAI",

            html: `

                <div style="font-family:Arial;padding:20px">

                    <h2>Recuperação de senha</h2>

                    <p>Seu código é:</p>

                    <h1 style="color:#b91c1c">${codigo}</h1>

                    <p>Este código expira em <strong>10 minutos</strong>.</p>

                    <hr>

                    <small>HematoAI - Sistema de apoio ao diagnóstico hematológico</small>

                </div>

            `

        });

    }

}