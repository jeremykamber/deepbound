import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { Persona } from '@/domain/entities/Persona';
import { PricingAnalysis } from '@/domain/entities/PricingAnalysis';

const PDF_THEME = {
    colors: {
        background: '#040404',
        foreground: '#FFFFFF',
        mutedForeground: '#71717A',
        primary: '#6366F1',
        card: '#0A0A0A',
        border: '#1F1F22',
        accent: '#FFFFFF'
    },
    spacing: {
        page: 40,
        section: 32,
        item: 12
    }
};

const styles = StyleSheet.create({
    page: {
        padding: PDF_THEME.spacing.page,
        backgroundColor: PDF_THEME.colors.background,
        color: PDF_THEME.colors.foreground,
        fontFamily: 'Helvetica',
    },
    // Branding Header
    brandHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 60,
    },
    brandName: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    reportType: {
        fontSize: 10,
        color: PDF_THEME.colors.mutedForeground,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Persona Name Section
    personaTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    personaOccupation: {
        fontSize: 12,
        color: PDF_THEME.colors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 48,
    },

    // Quote Section
    quoteContainer: {
        borderLeftWidth: 1,
        borderLeftColor: PDF_THEME.colors.primary,
        paddingLeft: 24,
        marginBottom: 60,
    },
    quoteText: {
        fontSize: 22,
        fontStyle: 'italic',
        lineHeight: 1.4,
        color: PDF_THEME.colors.foreground,
    },

    // Metrics Row
    metricsContainer: {
        flexDirection: 'row',
        marginBottom: 80,
        gap: 40,
    },
    metricBlock: {
        flex: 1,
    },
    metricLabel: {
        fontSize: 8,
        color: PDF_THEME.colors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: PDF_THEME.colors.border,
    },
    metricValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    metricValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    metricMax: {
        fontSize: 10,
        color: PDF_THEME.colors.mutedForeground,
        marginLeft: 2,
    },

    // Content Grid (Summary & Risks)
    contentGrid: {
        flexDirection: 'row',
        gap: 48,
    },
    summaryColumn: {
        flex: 1.2,
    },
    risksColumn: {
        flex: 1,
    },
    columnLabel: {
        fontSize: 8,
        color: PDF_THEME.colors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    summaryText: {
        fontSize: 10,
        lineHeight: 1.6,
        color: '#D4D4D8',
    },

    // Risks / Friction Points
    riskItem: {
        backgroundColor: PDF_THEME.colors.card,
        borderRadius: 6,
        padding: 10,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: PDF_THEME.colors.border,
    },
    riskText: {
        fontSize: 9,
        lineHeight: 1.4,
        color: '#A1A1AA',
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: PDF_THEME.spacing.page,
        left: PDF_THEME.spacing.page,
        right: PDF_THEME.spacing.page,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: PDF_THEME.colors.border,
    },
    footerText: {
        fontSize: 7,
        color: '#444444',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    }
});

interface PersonaAnalysisPDFProps {
    personas: Persona[];
    analyses: PricingAnalysis[];
    pricingUrl: string;
}

const MetricBlock: React.FC<{ label: string, value: number }> = ({ label, value }) => (
    <View style={styles.metricBlock}>
        <Text style={styles.metricLabel}>{label}</Text>
        <View style={styles.metricValueRow}>
            <Text style={styles.metricValue}>{value}</Text>
            <Text style={styles.metricMax}>/ 10</Text>
        </View>
    </View>
);

const RiskItem: React.FC<{ text: string }> = ({ text }) => (
    <View style={styles.riskItem}>
        <Text style={styles.riskText}>{text}</Text>
    </View>
);

const AnalysisPage: React.FC<{ persona: Persona, analysis: PricingAnalysis }> = ({ persona, analysis }) => (
    <Page size="A4" style={styles.page}>
        <View style={styles.brandHeader}>
            <Text style={styles.brandName}>DeepBound</Text>
            <Text style={styles.reportType}>Buyer Persona Audit</Text>
        </View>

        <View>
            <Text style={styles.personaTitle}>{persona.name}</Text>
            <Text style={styles.personaOccupation}>{persona.occupation}</Text>
        </View>

        <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>&ldquo;{analysis.gutReaction}&rdquo;</Text>
        </View>

        <View style={styles.metricsContainer}>
            <MetricBlock label="UI Clarity" value={analysis.scores.clarity} />
            <MetricBlock label="Value Perception" value={analysis.scores.valuePerception} />
            <MetricBlock label="Psychological Trust" value={analysis.scores.trust} />
            <MetricBlock label="Buying Likelihood" value={analysis.scores.likelihoodToBuy} />
        </View>

        <View style={styles.contentGrid}>
            <View style={styles.summaryColumn}>
                <Text style={styles.columnLabel}>Summary</Text>
                <Text style={styles.summaryText}>
                    {analysis.rawAnalysis || analysis.thoughts}
                </Text>
            </View>

            <View style={styles.risksColumn}>
                <Text style={styles.columnLabel}>Why they hesitate</Text>
                {analysis.risks.map((risk, i) => (
                    <RiskItem key={i} text={risk} />
                ))}
            </View>
        </View>

        <View style={styles.footer} fixed>
            <Text style={styles.footerText}>Behavioral Fidelity Report • {new Date().getFullYear()}</Text>
            <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
    </Page>
);

export const PersonaAnalysisReport: React.FC<PersonaAnalysisPDFProps> = ({
    personas,
    analyses,
}) => (
    <Document title="DeepBound Analysis Report">
        {personas.map((persona, index) => {
            const analysis = analyses[index];
            if (!analysis) return null;
            return (
                <AnalysisPage
                    key={persona.id}
                    persona={persona}
                    analysis={analysis}
                />
            );
        })}
    </Document>
);
