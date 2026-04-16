import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type ResetPasswordEmailProps = {
  appName: string;
  userEmail: string;
  resetUrl: string;
  logoUrl?: string;
};

export function ResetPasswordEmail({ appName, userEmail, resetUrl, logoUrl }: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Redefinir senha no {appName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl ? (
            <Section style={{ textAlign: "center", marginBottom: "20px" }}>
              <img src={logoUrl} alt={appName} style={{ maxWidth: "220px", height: "auto", margin: "0 auto" }} />
            </Section>
          ) : null}
          <Heading style={h1}>Redefinir senha</Heading>
          <Text style={text}>Olá, {userEmail}.</Text>
          <Text style={text}>Recebemos um pedido para redefinir a senha da sua conta no {appName}.</Text>
          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Button href={resetUrl} style={button}>
              Redefinir senha
            </Button>
          </Section>
          <Text style={text}>
            Se o botão não funcionar, copie e cole este link no navegador:
            <br />
            <Link href={resetUrl} style={link}>
              {resetUrl}
            </Link>
          </Text>
          <Text style={text}>Este link expira em aproximadamente 1 hora.</Text>
          <Hr style={hr} />
          <Text style={footer}>Se você não solicitou, ignore este e-mail. Sua senha não será alterada.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#e9f5f8",
  fontFamily: "Inter, Segoe UI, Arial, sans-serif",
  margin: 0,
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #cde5ea",
  borderRadius: "14px",
  margin: "0 auto",
  maxWidth: "600px",
  padding: "26px",
};

const h1 = {
  color: "#0d2e4f",
  fontSize: "24px",
  margin: "0 0 18px",
};

const text = {
  color: "#2a4c57",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const button = {
  backgroundColor: "#1f7fa3",
  borderRadius: "10px",
  color: "#ffffff",
  display: "inline-block",
  fontWeight: "600",
  padding: "12px 22px",
  textDecoration: "none",
};

const link = {
  color: "#1f7fa3",
  fontSize: "13px",
  wordBreak: "break-all" as const,
};

const hr = {
  borderColor: "#d7e9ed",
  margin: "22px 0 14px",
};

const footer = {
  color: "#5c7c86",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: 0,
};
