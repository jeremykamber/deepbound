import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Persona } from '@/domain/entities/Persona';
import { PricingAnalysis } from '@/domain/entities/PricingAnalysis';

const PDF_THEME = {
    colors: {
        background: '#0A0A0A',
        foreground: '#F5F5F5',
        card: '#141414',
        primary: '#6366F1',
        mutedForeground: '#9CA3AF',
        border: 'rgba(255, 255, 255, 0.10)' // 10% white
    },
    radii: {
        sm: 6,
        md: 8,
        lg: 16
    }
};

// Note: Using standard fonts for reliability, but styling them to look premium
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: PDF_THEME.colors.background,
        color: PDF_THEME.colors.foreground,
        fontFamily: 'Helvetica',
    },
    // Cover Page Styles
    coverPage: {
        padding: 60,
        backgroundColor: PDF_THEME.colors.background,
        color: PDF_THEME.colors.foreground,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
    },
    logoBox: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 1,
        borderColor: PDF_THEME.colors.border,
        borderRadius: PDF_THEME.radii.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    logoText: {
        color: PDF_THEME.colors.primary,
        fontSize: 20,
        fontWeight: 'bold',
    },
    brandTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    heroTitle: {
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: 20,
        letterSpacing: -1,
    },
    heroSubtitle: {
        fontSize: 18,
        color: PDF_THEME.colors.mutedForeground,
        marginBottom: 60,
        fontWeight: 'light',
        lineHeight: 1.5,
    },
    metadataRow: {
        borderTopWidth: 1,
        borderTopColor: PDF_THEME.colors.border,
        paddingTop: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metadataItem: {
        flex: 1,
    },
    metadataLabel: {
        fontSize: 10,
        color: PDF_THEME.colors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 8,
        fontWeight: 'bold',
    },
    metadataValue: {
        fontSize: 14,
        color: PDF_THEME.colors.foreground,
    },

    // Analysis Page Styles
    header: {
        marginBottom: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderBottomWidth: 1,
        borderBottomColor: PDF_THEME.colors.border,
        paddingBottom: 20,
    },
    headerLeft: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: PDF_THEME.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    pageNumber: {
        fontSize: 10,
        color: PDF_THEME.colors.mutedForeground,
    },

    personaHeader: {
        marginBottom: 40,
    },
    personaIdentifier: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    personaAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 1,
        borderColor: PDF_THEME.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    personaName: {
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    personaOccupation: {
        fontSize: 14,
        color: PDF_THEME.colors.mutedForeground,
        fontWeight: 'light',
    },

    gutReactionContainer: {
        paddingLeft: 20,
        borderLeftWidth: 2,
        borderLeftColor: PDF_THEME.colors.primary,
        marginBottom: 40,
        marginTop: 10,
    },
    gutReactionLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: PDF_THEME.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 8,
    },
    gutReactionText: {
        fontSize: 18,
        color: PDF_THEME.colors.foreground,
        fontStyle: 'italic',
        lineHeight: 1.4,
    },

    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: PDF_THEME.colors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 20,
        marginTop: 40,
    },

    metricGrid: {
        flexDirection: 'row',
        marginBottom: 40,
        gap: 20,
    },
    metricBlock: {
        flex: 1,
        padding: 15,
        backgroundColor: PDF_THEME.colors.card,
        borderRadius: PDF_THEME.radii.md,
        borderWidth: 1,
        borderColor: PDF_THEME.colors.border,
    },
    metricLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: PDF_THEME.colors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    metricValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    metricValue: {
        fontSize: 28,
        fontWeight: 'light',
        color: PDF_THEME.colors.foreground,
    },
    metricMax: {
        fontSize: 10,
        color: PDF_THEME.colors.mutedForeground,
        fontWeight: 'bold',
    },
    metricHighlight: {
        color: PDF_THEME.colors.primary,
    },

    monologueContainer: {
        marginBottom: 30,
    },
    monologueParagraph: {
        fontSize: 11,
        color: PDF_THEME.colors.foreground,
        lineHeight: 1.6,
        marginBottom: 12,
        fontWeight: 'light',
    },

    concernsContainer: {
        gap: 10,
    },
    concernItem: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: PDF_THEME.radii.md,
        borderWidth: 1,
        borderColor: PDF_THEME.colors.border,
        alignItems: 'flex-start',
    },
    concernIcon: {
        width: 12,
        color: PDF_THEME.colors.primary,
        fontSize: 14,
        marginRight: 10,
        marginTop: -2,
    },
    concernText: {
        fontSize: 10,
        color: PDF_THEME.colors.mutedForeground,
        lineHeight: 1.4,
        flex: 1,
    },

    personaDetailGrid: {
        flexDirection: 'row',
        gap: 30,
        marginTop: 20,
    },
    personaDetailColumn: {
        flex: 1,
    },
    personaDetailLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: PDF_THEME.colors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    personaDetailText: {
        fontSize: 10,
        color: PDF_THEME.colors.foreground,
        lineHeight: 1.5,
    },

    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: PDF_THEME.colors.border,
        paddingTop: 15,
    },
    footerText: {
        fontSize: 8,
        color: PDF_THEME.colors.mutedForeground,
        letterSpacing: 0.5,
    }
});

interface PersonaAnalysisPDFProps {
    personas: Persona[];
    analyses: PricingAnalysis[];
    pricingUrl: string;
}

const ReportCoverPage: React.FC<{ personasCount: number, pricingUrl: string }> = ({ personasCount, pricingUrl }) => (
    <Page size="A4" style={styles.coverPage}>
        <View style={styles.brandContainer}>
            <View style={styles.logoBox}>
                <Text style={styles.logoText}>D</Text>
            </View>
            <Text style={styles.brandTitle}>DeepBound</Text>
        </View>

        <Text style={styles.heroTitle}>Pricing Analysis Report</Text>
        <Text style={styles.heroSubtitle}>
            A high-fidelity behavioral audit of pricing structures and psychological triggers
            conducted through the lens of targeted buyer personas.
        </Text>

        <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Source URL</Text>
                <Text style={styles.metadataValue}>{pricingUrl.replace('https://', '').split('/')[0]}</Text>
            </View>
            <View style={{ ...styles.metadataItem, flex: 0.5 }}>
                <Text style={styles.metadataLabel}>Sample Size</Text>
                <Text style={styles.metadataValue}>{personasCount} Personas</Text>
            </View>
            <View style={{ ...styles.metadataItem, flex: 0.5 }}>
                <Text style={styles.metadataLabel}>Date</Text>
                <Text style={styles.metadataValue}>{new Date().toLocaleDateString()}</Text>
            </View>
        </View>
    </Page>
);

const PersonaAnalysisPage: React.FC<{ persona: Persona, analysis: PricingAnalysis, pricingUrl: string }> = ({ persona, analysis, pricingUrl }) => (
    <Page size="A4" style={styles.page}>
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Buyer Audit</Text>
                <Text style={styles.headerSubtitle}>{new URL(pricingUrl).hostname}</Text>
            </View>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
                `Page ${pageNumber} of ${totalPages}`
            )} fixed />
        </View>

        <View style={styles.personaHeader}>
            <View style={styles.personaIdentifier}>
                <View style={styles.personaAvatar}>
                    <Text style={{ color: PDF_THEME.colors.primary, fontSize: 12, fontWeight: 'bold' }}>{persona.name[0]}</Text>
                </View>
                <View>
                    <Text style={styles.personaName}>{persona.name}</Text>
                    <Text style={styles.personaOccupation}>{persona.occupation}</Text>
                </View>
            </View>
        </View>

        <View style={styles.gutReactionContainer}>
            <Text style={styles.gutReactionLabel}>First Impression</Text>
            <Text style={styles.gutReactionText}>&ldquo;{analysis.gutReaction}&rdquo;</Text>
        </View>

        <View style={styles.metricGrid} wrap={false}>
            <MetricBlock label="Clarity" value={analysis.scores.clarity} />
            <MetricBlock label="Value" value={analysis.scores.valuePerception} />
            <MetricBlock label="Trust" value={analysis.scores.trust} />
            <MetricBlock label="Purchase" value={analysis.scores.likelihoodToBuy} highlight />
        </View>

        <Text style={styles.sectionTitle}>Full Monologue</Text>
        <View style={styles.monologueContainer}>
            {(analysis.rawAnalysis || analysis.thoughts)
                .split('\n\n')
                .filter(p => p.trim())
                .map((p, pIdx) => (
                    <Text key={pIdx} style={styles.monologueParagraph}>
                        {p.trim()}
                    </Text>
                ))
            }
        </View>

        {analysis.risks.length > 0 && (
            <View wrap={false}>
                <Text style={styles.sectionTitle}>Friction Points</Text>
                <View style={styles.concernsContainer}>
                    {analysis.risks.map((risk, idx) => (
                        <View key={idx} style={styles.concernItem}>
                            <Text style={styles.concernIcon}>•</Text>
                            <Text style={styles.concernText}>{risk}</Text>
                        </View>
                    ))}
                </View>
            </View>
        )}

        <View style={{ marginTop: 'auto' }}>
            <Text style={styles.sectionTitle}>Persona Context</Text>
            <View style={styles.personaDetailGrid} wrap={false}>
                <View style={styles.personaDetailColumn}>
                    <Text style={styles.personaDetailLabel}>Backstory</Text>
                    <Text style={styles.personaDetailText}>{persona.backstory ? `${persona.backstory.substring(0, 300)}...` : "No backstory provided."}</Text>
                </View>
                <View style={styles.personaDetailColumn}>
                    <Text style={styles.personaDetailLabel}>Goals</Text>
                    {persona.goals.map((goal, i) => (
                        <Text key={i} style={{ ...styles.personaDetailText, marginBottom: 4 }}>• {goal}</Text>
                    ))}
                </View>
            </View>
        </View>

        <View style={styles.footer} fixed>
            <Text style={styles.footerText}>DEEPBOUND BEHAVIORAL FIDELITY REPORT</Text>
            <Text style={styles.footerText}>{new Date().getFullYear()} • CONFIDENTIAL</Text>
        </View>
    </Page>
);

export const PersonaAnalysisReport: React.FC<PersonaAnalysisPDFProps> = ({
    personas,
    analyses,
    pricingUrl
}) => (
    <Document title="DeepBound Pricing Analysis Report">
        <ReportCoverPage personasCount={personas.length} pricingUrl={pricingUrl} />

        {personas.map((persona, index) => {
            const analysis = analyses[index];
            if (!analysis) return null;

            return (
                <PersonaAnalysisPage
                    key={persona.id}
                    persona={persona}
                    analysis={analysis}
                    pricingUrl={pricingUrl}
                />
            );
        })}
    </Document>
);

const MetricBlock: React.FC<{ label: string, value: number, highlight?: boolean }> = ({ label, value, highlight }) => (
    <View style={styles.metricBlock}>
        <Text style={styles.metricLabel}>{label}</Text>
        <View style={styles.metricValueContainer}>
            <Text style={highlight ? [styles.metricValue, styles.metricHighlight] : styles.metricValue}>{value}</Text>
            <Text style={styles.metricMax}>/10</Text>
        </View>
    </View>
);
