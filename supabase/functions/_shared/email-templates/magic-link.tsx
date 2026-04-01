/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de login — {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Seu link de acesso</Heading>
        <Text style={text}>
          Use o botão abaixo para acessar sua conta no {siteName}. 
          Este link é válido por tempo limitado.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Acessar Minha Conta
        </Button>
        <Text style={footer}>
          Se você não solicitou este link, ignore este email com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Montserrat', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#0A0907',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#999591',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const button = {
  backgroundColor: '#FFD700',
  color: '#0A0907',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '0px',
  padding: '12px 24px',
  textDecoration: 'none',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
}
const footer = { fontSize: '12px', color: '#999591', margin: '30px 0 0' }
