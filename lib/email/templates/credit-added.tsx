import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type CreditAddedEmailProps = {
  appName: string;
  userEmail: string;
  amountLabel: string;
  balanceLabel: string;
  note?: string | null;
  grantedByEmail: string;
  logoUrl?: string;
};

export function CreditAddedEmail({
  appName,
  userEmail,
  amountLabel,
  balanceLabel,
  note,
  grantedByEmail,
  logoUrl,
}: CreditAddedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Voce recebeu novo credito no {appName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl ? (
            <Section style={{ textAlign: "center", marginBottom: "20px" }}>
              <img src={logoUrl} alt={appName} style={{ maxWidth: "220px", height: "auto", margin: "0 auto" }} />
            </Section>
          ) : null}
          <Heading style={h1}>Credito adicionado</Heading>
          <Text style={text}>Olá, {userEmail}.</Text>
          <Text style={text}>Foi adicionado um novo credito na sua conta do {appName}.</Text>
          <Section style={summaryBox}>
            <Text style={row}>
              <strong>Valor adicionado:</strong> {amountLabel}
            </Text>
            <Text style={row}>
              <strong>Saldo atual:</strong> {balanceLabel}
            </Text>
            <Text style={row}>
              <strong>Lancado por:</strong> {grantedByEmail}
            </Text>
            {note ? (
              <Text style={row}>
                <strong>Observacao:</strong> {note}
              </Text>
            ) : null}
          </Section>
          <Hr style={hr} />
          <Text style={footer}>Esse e-mail e informativo e nao exige resposta.</Text>
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

const summaryBox = {
  backgroundColor: "#f3fbfd",
  border: "1px solid #d5edf2",
  borderRadius: "12px",
  margin: "18px 0",
  padding: "12px 14px",
};

const row = {
  color: "#23454f",
  fontSize: "14px",
  margin: "0 0 8px",
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
