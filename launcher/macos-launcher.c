#include <CoreFoundation/CoreFoundation.h>
#include <unistd.h>
#include <sys/wait.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>

static void log_launcher(const char *format, ...) {
  FILE *log = fopen("/tmp/SMART ReplySuite/launcher.log", "a");
  if (!log) return;

  va_list args;
  va_start(args, format);
  vfprintf(log, format, args);
  fprintf(log, "\n");
  va_end(args);
  fclose(log);
}

static int path_exists(const char *path) {
  struct stat st;
  return stat(path, &st) == 0;
}

static int is_executable(const char *path) {
  return access(path, X_OK) == 0;
}

static int is_node_usable(const char *path) {
  if (!is_executable(path)) return 0;

  pid_t pid = fork();
  if (pid == 0) {
    int dev_null = open("/dev/null", 2);
    if (dev_null >= 0) {
      dup2(dev_null, STDOUT_FILENO);
      dup2(dev_null, STDERR_FILENO);
    }
    execl(path, path, "--version", NULL);
    _exit(127);
  }

  if (pid < 0) return 0;

  int status = 0;
  if (waitpid(pid, &status, 0) < 0) return 0;
  return WIFEXITED(status) && WEXITSTATUS(status) == 0;
}

static int curl_contains_replysuite(const char *url) {
  int pipefd[2];
  if (pipe(pipefd) != 0) return 0;

  pid_t curl_pid = fork();
  if (curl_pid == 0) {
    dup2(pipefd[1], STDOUT_FILENO);
    int dev_null = open("/dev/null", 2);
    if (dev_null >= 0) dup2(dev_null, STDERR_FILENO);
    close(pipefd[0]);
    close(pipefd[1]);
    execl("/usr/bin/curl", "curl", "-fsS", url, NULL);
    _exit(127);
  }

  close(pipefd[1]);
  char buffer[4096];
  ssize_t bytes;
  int found = 0;
  while ((bytes = read(pipefd[0], buffer, sizeof(buffer) - 1)) > 0) {
    buffer[bytes] = '\0';
    if (strstr(buffer, "SMART ReplySuite") != NULL) {
      found = 1;
      break;
    }
  }
  close(pipefd[0]);
  waitpid(curl_pid, NULL, 0);
  return found;
}

static void open_url(const char *url) {
  pid_t pid = fork();
  if (pid == 0) {
    execl("/usr/bin/open", "open", url, NULL);
    _exit(127);
  }
}

static int start_server(const char *node, const char *server, const char *port, const char *log_file) {
  pid_t pid = fork();
  if (pid != 0) return pid > 0;

  FILE *log = fopen(log_file, "a");
  if (log) {
    dup2(fileno(log), STDOUT_FILENO);
    dup2(fileno(log), STDERR_FILENO);
  }

  setenv("PORT", port, 1);
  execl(node, node, server, NULL);
  _exit(127);
}

int main(void) {
  const char *ports[] = {"8173", "8174", "8175", "8176", "8177"};
  const char *node = NULL;

  mkdir("/tmp/SMART ReplySuite", 0755);
  log_launcher("SMART ReplySuite launcher start");

  CFBundleRef bundle = CFBundleGetMainBundle();
  CFURLRef bundle_url = CFBundleCopyBundleURL(bundle);
  char bundle_path[4096] = {0};
  CFURLGetFileSystemRepresentation(bundle_url, true, (UInt8 *)bundle_path, sizeof(bundle_path));
  CFRelease(bundle_url);

  char app_root[4096];
  snprintf(app_root, sizeof(app_root), "%s/Contents/Resources/app", bundle_path);
  log_launcher("bundle_path=%s", bundle_path);

  char project_root[4096];
  snprintf(project_root, sizeof(project_root), "%s/..", bundle_path);

  char project_server[4096];
  snprintf(project_server, sizeof(project_server), "%s/localProxyServer.js", project_root);

  char project_modules[4096];
  snprintf(project_modules, sizeof(project_modules), "%s/node_modules/mammoth", project_root);
  if (path_exists(project_server) && path_exists(project_modules)) {
    snprintf(app_root, sizeof(app_root), "%s", project_root);
  }
  log_launcher("app_root=%s", app_root);

  char server_path[4096];
  snprintf(server_path, sizeof(server_path), "%s/localProxyServer.js", app_root);
  if (!path_exists(server_path)) {
    log_launcher("server missing: %s", server_path);
    return 1;
  }

  char bundled_node_arm64[4096];
  char bundled_node_x64[4096];
  char bundled_node_platform[4096];
  char bundled_node_bin[4096];
  snprintf(bundled_node_arm64, sizeof(bundled_node_arm64), "%s/vendor/node/darwin-arm64/bin/node", app_root);
  snprintf(bundled_node_x64, sizeof(bundled_node_x64), "%s/vendor/node/darwin-x64/bin/node", app_root);
  snprintf(bundled_node_platform, sizeof(bundled_node_platform), "%s/vendor/node/darwin/bin/node", app_root);
  snprintf(bundled_node_bin, sizeof(bundled_node_bin), "%s/bin/darwin/node", app_root);

  const char *node_candidates[] = {
    bundled_node_arm64,
    bundled_node_x64,
    bundled_node_platform,
    bundled_node_bin,
    "/opt/homebrew/bin/node",
    "/usr/local/bin/node",
    "/usr/bin/node"
  };

  for (size_t i = 0; i < sizeof(node_candidates) / sizeof(node_candidates[0]); i++) {
    int usable = is_node_usable(node_candidates[i]);
    log_launcher("node candidate %s usable=%d", node_candidates[i], usable);
    if (usable) {
      node = node_candidates[i];
      break;
    }
  }
  if (!node) {
    log_launcher("no usable node found");
    return 1;
  }
  log_launcher("selected node=%s", node);

  for (size_t i = 0; i < sizeof(ports) / sizeof(ports[0]); i++) {
    char url[128];
    snprintf(url, sizeof(url), "http://127.0.0.1:%s", ports[i]);
    if (curl_contains_replysuite(url)) {
      log_launcher("existing server detected: %s", url);
      open_url(url);
      return 0;
    }
  }

  for (size_t i = 0; i < sizeof(ports) / sizeof(ports[0]); i++) {
    char url[128];
    char log_file[4096];
    snprintf(url, sizeof(url), "http://127.0.0.1:%s", ports[i]);
    snprintf(log_file, sizeof(log_file), "/tmp/SMART ReplySuite/replysuite-server-%s.log", ports[i]);

    log_launcher("starting server port=%s log=%s", ports[i], log_file);
    if (!start_server(node, server_path, ports[i], log_file)) {
      log_launcher("fork failed for port=%s", ports[i]);
      continue;
    }

    for (int attempt = 0; attempt < 30; attempt++) {
      usleep(200000);
      if (curl_contains_replysuite(url)) {
        log_launcher("server ready: %s", url);
        open_url(url);
        return 0;
      }
    }
    log_launcher("server not ready after retries: %s", url);
  }

  log_launcher("launcher finished without ready server");
  return 0;
}
