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

type CollaboratorInviteEmailProps = {
  appName: string;
  displayName: string;
  inviteUrl: string;
  companyNames: string[];
  inviterLabel: string;
  logoUrl?: string;
};

export function CollaboratorInviteEmail({
  appName,
  displayName,
  inviteUrl,
  companyNames,
  inviterLabel,
  logoUrl,
}: CollaboratorInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Você recebeu um convite para acessar o {appName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl ? (
            <Section style={{ textAlign: "center", marginBottom: "20px" }}>
              <img src={logoUrl} alt={appName} style={{ maxWidth: "220px", height: "auto", margin: "0 auto" }} />
            </Section>
          ) : null}
          <Heading style={h1}>Convite para colaborador</Heading>
          <Text style={text}>Olá, {displayName}.</Text>
          <Text style={text}>
            {inviterLabel} convidou você para acessar o <strong>{appName}</strong> como colaborador.
          </Text>
          <Text style={text}>
            Empresas vinculadas neste convite: <strong>{companyNames.join(", ") || "Sem empresa informada"}</strong>.
          </Text>
          <Text style={text}>Para ativar seu acesso, crie sua senha clicando no botão abaixo:</Text>
          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Button href={inviteUrl} style={button}>
              Criar senha e ativar acesso
            </Button>
          </Section>
          <Text style={text}>
            Se o botão não funcionar, copie e cole este link no navegador:
            <br />
            <Link href={inviteUrl} style={link}>
              {inviteUrl}
            </Link>
          </Text>
          <Text style={text}>Este convite expira em aproximadamente 24 horas.</Text>
          <Hr style={hr} />
          <Text style={footer}>Se você não esperava este convite, ignore este e-mail.</Text>
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
  backgroundColor: "#24ac71",
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
