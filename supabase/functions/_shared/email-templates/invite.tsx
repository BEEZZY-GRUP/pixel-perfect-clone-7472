/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidado para o {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Você foi convidado!</Heading>
        <Text style={text}>
          Você recebeu um convite para fazer parte do{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Clique no botão abaixo para aceitar e configurar sua conta.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Aceitar Convite
        </Button>
        <Text style={footer}>
          Se você não esperava este convite, pode ignorar este email com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
const link = { color: '#0A0907', textDecoration: 'underline' }
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
