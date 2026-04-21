import {
  Body,
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

export const RoyaltyCertificateEmail = ({
  buyerName = "Value Partner",
  orderId = "ORD-12345",
  purchaseDate = new Date().toLocaleDateString(),
  amountPaid = "10.00",
  sharePercentage = "0.1",
  tokenId = "Pending",
  walletAddress = "0x000...000",
}) => {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Head />
      <Preview>
        Your stake in La Promesa Devuelta has been confirmed — Order {orderId}
      </Preview>
      <Body style={main}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Text style={headerLabel}>LA PROMESA DEVUELTA</Text>
            <Text style={headerSub}>La Llama que se Negó a Ser Poseída</Text>
          </Section>

          {/* Thanks */}
          <Section style={content}>
            <Heading style={h1}>Thank you, {buyerName}.</Heading>
            <Text style={paragraph}>
              Your Royalty Certificate has been confirmed. You now hold a stake
              in <strong>La Promesa Devuelta</strong> — not as a speculator,
              but as someone who has chosen to stand behind a work they believe in.
              That is not a small thing, and it will not be forgotten.
            </Text>
            <Text style={paragraph}>
              Below you will find your transaction summary, your wallet details,
              and the key terms of what you have agreed to.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Transaction Summary */}
          <Section style={content}>
            <Heading style={h2}>Transaction Summary</Heading>
            <Section style={summaryBox}>
              <Text style={summaryText}>
                <strong style={summaryLabelStyle}>Order ID: </strong>
                <span style={summaryValueStyle}>{orderId}</span>
              </Text>
              <Text style={summaryText}>
                <strong style={summaryLabelStyle}>Date: </strong>
                <span style={summaryValueStyle}>{purchaseDate}</span>
              </Text>
              <Text style={summaryText}>
                <strong style={summaryLabelStyle}>Item: </strong>
                <span style={summaryValueStyle}>
                  Royalty Certificate — La Promesa Devuelta
                </span>
              </Text>
              <Text style={summaryText}>
                <strong style={summaryLabelStyle}>Amount Paid: </strong>
                <span style={summaryValueStyle}>${amountPaid} USD</span>
              </Text>
              <Text style={summaryText}>
                <strong style={summaryLabelStyle}>Your Share: </strong>
                <span style={summaryValueStyle}>
                  {sharePercentage}% of net royalties
                </span>
              </Text>
              <Text style={summaryText}>
                <strong style={summaryLabelStyle}>Token ID: </strong>
                <span style={summaryValueStyle}>#{tokenId}</span>
              </Text>
            </Section>
          </Section>

          <Hr style={hr} />

          {/* Wallet */}
          <Section style={content}>
            <Heading style={h2}>Your Wallet</Heading>
            <Text style={paragraph}>
              A digital wallet has been created for you automatically — no seed
              phrase, no setup required. This is where your Royalty Certificate
              lives and where future USDC payouts will be deposited.
            </Text>
            <Section style={walletBox}>
              <Text style={walletLabelStyle}>Public Wallet Address</Text>
              <Text style={walletAddressStyle}>{walletAddress}</Text>
            </Section>
            <Text style={paragraph}>
              To view your certificate, track your balance and access future
              royalty distributions, log in to your dashboard with the same
              email you used for this purchase:
            </Text>
            <Section style={buttonContainer}>
              <Link href="https://dashboard.privy.io" style={button}>
                ACCESS YOUR DASHBOARD
              </Link>
            </Section>
          </Section>

          <Hr style={hr} />

          {/* Royalty Terms */}
          <Section style={content}>
            <Heading style={h2}>Key Terms of Your Royalty Agreement</Heading>
            <Text style={paragraph}>
              This is a summary of what you have agreed to. The full legal
              agreement is available in your dashboard.
            </Text>
            <Section style={termsBox}>
              <Text style={termItem}>
                — You hold a <strong>{sharePercentage}%</strong> revenue-share
                interest in the net royalties collected from{" "}
                <strong>La Promesa Devuelta</strong>.
              </Text>
              <Text style={termItem}>
                — Royalties are collected in fiat (USD/EUR), converted to USDC,
                and distributed proportionally to all certificate holders.
              </Text>
              <Text style={termItem}>
                — Distributions are issued on a quarterly basis, or as
                announced. You will be notified by email before each payout.
              </Text>
              <Text style={termItem}>
                — Your certificate is represented as an NFT (Token #{tokenId})
                held in your embedded wallet. It is non-transferable during the
                initial period defined in the full agreement.
              </Text>
              <Text style={termItem}>
                — This certificate does not constitute equity, voting rights, or
                ownership of the work itself — only a share of its future
                royalty income.
              </Text>
            </Section>
            <Text style={termsNote}>
              Questions about the agreement? Reply to this email or write to{" "}
              <Link
                href="mailto:press@lapromesadevuelta.com"
                style={inlineLink}
              >
                press@lapromesadevuelta.com
              </Link>
              .
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerTitle}>LA PROMESA DEVUELTA</Text>
            <Text style={footerText}>
              © {year} La Promesa Devuelta. All rights reserved.
            </Text>
            <Text style={footerText}>
              This is an automated confirmation. Please keep it for your records.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

export default RoyaltyCertificateEmail;

// ─── Styles ────────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "#0d0d0d",
  fontFamily: "Georgia, 'Times New Roman', serif",
  margin: "0",
  padding: "0",
};

const container = {
  maxWidth: "600px",
  margin: "40px auto",
  backgroundColor: "#111010",
  border: "1px solid #2a2520",
};

const header = {
  padding: "40px 48px 32px",
  borderBottom: "1px solid #2a2520",
  textAlign: "center",
};

const headerLabel = {
  margin: "0",
  fontSize: "12px",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontWeight: "700",
  letterSpacing: "0.35em",
  textTransform: "uppercase",
  color: "#c4a96a",
};

const headerSub = {
  margin: "8px 0 0",
  fontSize: "14px",
  fontStyle: "italic",
  color: "#6a5f50",
  letterSpacing: "0.05em",
};

const content = {
  padding: "36px 48px",
};

const h1 = {
  margin: "0 0 20px",
  fontSize: "26px",
  fontWeight: "600",
  color: "#e8e0d0",
  lineHeight: "1.3",
};

const h2 = {
  margin: "0 0 16px",
  fontSize: "16px",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontWeight: "700",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "#c4a96a",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.75",
  margin: "0 0 16px",
  color: "#a09080",
};

const summaryBox = {
  backgroundColor: "#161412",
  border: "1px solid #2a2520",
  padding: "20px 24px",
};

const summaryText = {
  margin: "6px 0",
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#a09080",
};

const summaryLabelStyle = {
  color: "#6a5f50",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: "11px",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

const summaryValueStyle = {
  color: "#d4c9b5",
};

const walletBox = {
  backgroundColor: "#161412",
  borderLeft: "3px solid #c4a96a",
  padding: "16px 20px",
  margin: "0 0 20px",
};

const walletLabelStyle = {
  margin: "0 0 6px",
  fontSize: "10px",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontWeight: "700",
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "#6a5f50",
};

const walletAddressStyle = {
  margin: "0",
  fontSize: "13px",
  fontFamily: "monospace",
  color: "#c4a96a",
  wordBreak: "break-all",
};

const buttonContainer = {
  textAlign: "center",
  margin: "28px 0 8px",
};

const button = {
  display: "inline-block",
  backgroundColor: "#c4a96a",
  color: "#0d0d0d",
  padding: "14px 36px",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  textDecoration: "none",
};

const termsBox = {
  backgroundColor: "#161412",
  border: "1px solid #2a2520",
  padding: "20px 24px",
  margin: "0 0 20px",
};

const termItem = {
  fontSize: "14px",
  lineHeight: "1.7",
  color: "#a09080",
  margin: "0 0 12px",
};

const termsNote = {
  fontSize: "13px",
  color: "#6a5f50",
  margin: "0",
  fontStyle: "italic",
};

const inlineLink = {
  color: "#c4a96a",
  textDecoration: "underline",
};

const hr = {
  borderColor: "#2a2520",
  margin: "0",
};

const footer = {
  textAlign: "center",
  padding: "28px 48px",
  backgroundColor: "#0d0d0d",
};

const footerTitle = {
  margin: "0 0 8px",
  fontSize: "10px",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontWeight: "700",
  letterSpacing: "0.35em",
  textTransform: "uppercase",
  color: "#3a3028",
};

const footerText = {
  margin: "2px 0",
  fontSize: "11px",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  color: "#3a3028",
  letterSpacing: "0.05em",
};