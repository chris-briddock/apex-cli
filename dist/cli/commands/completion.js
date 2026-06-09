/**
 * Completion command - Generate shell completion scripts
 */
import { logger } from '../utils/logger.js';
/**
 * Bash completion script template
 */
const BASH_COMPLETION = `_apexcss() {
    local cur prev opts commands
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"
    commands="init build watch doctor purge completion"

    case "\${prev}" in
        apexcss)
            COMPREPLY=( $(compgen -W "\${commands}" -- \${cur}) )
            return 0
            ;;
        init)
            COMPREPLY=( $(compgen -W "--framework --no-import --config --output --minify --sourcemap --verbose --quiet" -- \${cur}) )
            return 0
            ;;
        build)
            COMPREPLY=( $(compgen -W "--format --layer --config --output --minify --sourcemap --verbose --quiet" -- \${cur}) )
            return 0
            ;;
        watch)
            COMPREPLY=( $(compgen -W "--config --output --minify --sourcemap --verbose --quiet" -- \${cur}) )
            return 0
            ;;
        doctor)
            COMPREPLY=( $(compgen -W "--verbose --quiet" -- \${cur}) )
            return 0
            ;;
        purge)
            COMPREPLY=( $(compgen -W "--src --dry-run --yes --backup --verbose --quiet --config" -- \${cur}) )
            return 0
            ;;
        completion)
            COMPREPLY=( $(compgen -W "bash zsh fish" -- \${cur}) )
            return 0
            ;;
        --framework|-f)
            COMPREPLY=( $(compgen -W "react vue angular svelte astro next nuxt vanilla" -- \${cur}) )
            return 0
            ;;
        --format)
            COMPREPLY=( $(compgen -W "css scss both" -- \${cur}) )
            return 0
            ;;
        --layer|-l)
            COMPREPLY=( $(compgen -W "base utilities themes all" -- \${cur}) )
            return 0
            ;;
    esac

    if [[ \${cur} == -* ]]; then
        COMPREPLY=( $(compgen -W "--config --output --minify --sourcemap --verbose --quiet --version --help" -- \${cur}) )
        return 0
    fi
}

complete -F _apexcss apexcss
complete -F _apexcss apexcss-cli
`;
/**
 * Zsh completion script template
 */
const ZSH_COMPLETION = `#compdef apexcss apexcss-cli

_apexcss() {
    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \\
        '(-v --version)'{-v,--version}'[Show version]' \\
        '(-h --help)'{-h,--help}'[Show help]' \\
        '(-c --config)'{-c,--config}'[Config file path]:config:_files -g "*.js"' \\
        '(-o --output)'{-o,--output}'[Output directory]:directory:_directories' \\
        '--minify[Minify output CSS]' \\
        '--sourcemap[Generate source maps]' \\
        '(-V --verbose)'{-V,--verbose}'[Show verbose output]' \\
        '(-q --quiet)'{-q,--quiet}'[Suppress non-error output]' \\
        '1: :->command' \\
        '*:: :->args'

    case "$state" in
        command)
            _values 'commands' \\
                'init[Initialize ApexCSS configuration]' \\
                'build[Build custom CSS]' \\
                'watch[Watch for changes]' \\
                'doctor[Check system setup]' \\
                'purge[Optimize configuration]' \\
                'completion[Generate shell completions]'
            ;;
        args)
            case "$line[1]" in
                init)
                    _arguments \\
                        '(-f --framework)'{-f,--framework}'[Specify framework]:framework:(react vue angular svelte astro next nuxt vanilla)' \\
                        '--no-import[Skip adding imports to entry files]'
                    ;;
                build)
                    _arguments \\
                        '--format[Output format]:format:(css scss both)' \\
                        '(-l --layer)'{-l,--layer}'[Build specific layers]:layer:(base utilities themes all)'
                    ;;
                purge)
                    _arguments \\
                        '--src[Source directories to scan]:directories:_directories' \\
                        '--dry-run[Show changes without applying]' \\
                        '(-y --yes)'{-y,--yes}'[Skip confirmation]' \\
                        '--backup[Create backup before modifying]'
                    ;;
                completion)
                    _arguments '1: :->shell'
                    case "$line[1]" in
                        shell)
                            _values 'shell' 'bash' 'zsh' 'fish'
                            ;;
                    esac
                    ;;
            esac
            ;;
    esac
}

_apexcss "$@"
`;
/**
 * Fish completion script template
 */
const FISH_COMPLETION = `# ApexCSS CLI completions

# Disable file completions for the main command
complete -c apexcss -f
complete -c apexcss-cli -f

# Global options
complete -c apexcss -s v -l version -d "Show version"
complete -c apexcss -s h -l help -d "Show help"
complete -c apexcss -s c -l config -d "Config file path" -r
complete -c apexcss -s o -l output -d "Output directory" -r
complete -c apexcss -l minify -d "Minify output CSS"
complete -c apexcss -l sourcemap -d "Generate source maps"
complete -c apexcss -s V -l verbose -d "Show verbose output"
complete -c apexcss -s q -l quiet -d "Suppress non-error output"

# Commands
complete -c apexcss -n "__fish_use_subcommand" -a "init" -d "Initialize ApexCSS configuration"
complete -c apexcss -n "__fish_use_subcommand" -a "build" -d "Build custom CSS"
complete -c apexcss -n "__fish_use_subcommand" -a "watch" -d "Watch for changes"
complete -c apexcss -n "__fish_use_subcommand" -a "doctor" -d "Check system setup"
complete -c apexcss -n "__fish_use_subcommand" -a "purge" -d "Optimize configuration"
complete -c apexcss -n "__fish_use_subcommand" -a "completion" -d "Generate shell completions"

# Init command options
complete -c apexcss -n "__fish_seen_subcommand_from init" -s f -l framework -d "Specify framework" -a "react vue angular svelte astro next nuxt vanilla"
complete -c apexcss -n "__fish_seen_subcommand_from init" -l no-import -d "Skip adding imports"

# Build command options
complete -c apexcss -n "__fish_seen_subcommand_from build" -l format -d "Output format" -a "css scss both"
complete -c apexcss -n "__fish_seen_subcommand_from build" -s l -l layer -d "Build specific layers" -a "base utilities themes all"

# Purge command options
complete -c apexcss -n "__fish_seen_subcommand_from purge" -l src -d "Source directories" -r
complete -c apexcss -n "__fish_seen_subcommand_from purge" -l dry-run -d "Show changes without applying"
complete -c apexcss -n "__fish_seen_subcommand_from purge" -s y -l yes -d "Skip confirmation"
complete -c apexcss -n "__fish_seen_subcommand_from purge" -l backup -d "Create backup"

# Completion command options
complete -c apexcss -n "__fish_seen_subcommand_from completion" -a "bash zsh fish"
`;
/**
 * Available shell types
 */
const SHELLS = {
    bash: BASH_COMPLETION,
    zsh: ZSH_COMPLETION,
    fish: FISH_COMPLETION
};
/**
 * Get installation instructions for a shell
 */
function getInstallInstructions(shell) {
    const instructions = {
        bash: `
# Bash - Save to completions directory:
apexcss completion bash > /usr/share/bash-completion/completions/apexcss

# Or add to your ~/.bashrc:
eval "$(apexcss completion bash)"
`,
        zsh: `
# Zsh - Save to site-functions directory:
apexcss completion zsh > /usr/local/share/zsh/site-functions/_apexcss

# Or add to your ~/.zshrc:
eval "$(apexcss completion zsh)"
`,
        fish: `
# Fish - Save to completions directory:
apexcss completion fish > ~/.config/fish/completions/apexcss.fish
`
    };
    return instructions[shell] || '';
}
/**
 * Generate shell completion script
 */
export async function completionCommand(options) {
    const shell = options.shell?.toLowerCase();
    if (!shell || !SHELLS[shell]) {
        logger.error(`Unknown shell: ${shell || 'undefined'}`);
        logger.info('Supported shells: bash, zsh, fish');
        logger.info('');
        logger.info('Usage:');
        logger.info('  apexcss completion bash');
        logger.info('  apexcss completion zsh');
        logger.info('  apexcss completion fish');
        process.exit(1);
    }
    // Output the completion script
    console.log(SHELLS[shell]);
    // Show installation instructions to stderr so they don't pollute the script output
    logger.newline();
    logger.info('Installation instructions:');
    logger.info(getInstallInstructions(shell));
}
//# sourceMappingURL=completion.js.map