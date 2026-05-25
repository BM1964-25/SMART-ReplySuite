#include <CoreFoundation/CoreFoundation.h>
#include <unistd.h>
#include <sys/wait.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int path_exists(const char *path) {
  struct stat st;
  return stat(path, &st) == 0;
}

static int is_executable(const char *path) {
  return access(path, X_OK) == 0;
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
  const char *node_candidates[] = {"/opt/homebrew/bin/node", "/usr/local/bin/node", "/usr/bin/node"};
  const char *node = NULL;

  CFBundleRef bundle = CFBundleGetMainBundle();
  CFURLRef bundle_url = CFBundleCopyBundleURL(bundle);
  char bundle_path[4096] = {0};
  CFURLGetFileSystemRepresentation(bundle_url, true, (UInt8 *)bundle_path, sizeof(bundle_path));
  CFRelease(bundle_url);

  char app_root[4096];
  snprintf(app_root, sizeof(app_root), "%s/Contents/Resources/app", bundle_path);

  char project_root[4096];
  snprintf(project_root, sizeof(project_root), "%s/..", bundle_path);

  char project_server[4096];
  snprintf(project_server, sizeof(project_server), "%s/localProxyServer.js", project_root);

  char project_modules[4096];
  snprintf(project_modules, sizeof(project_modules), "%s/node_modules/mammoth", project_root);
  if (path_exists(project_server) && path_exists(project_modules)) {
    snprintf(app_root, sizeof(app_root), "%s", project_root);
  }

  char server_path[4096];
  snprintf(server_path, sizeof(server_path), "%s/localProxyServer.js", app_root);
  if (!path_exists(server_path)) return 1;

  for (size_t i = 0; i < sizeof(node_candidates) / sizeof(node_candidates[0]); i++) {
    if (is_executable(node_candidates[i])) {
      node = node_candidates[i];
      break;
    }
  }
  if (!node) return 1;

  mkdir("/tmp/SMART ReplySuite", 0755);

  for (size_t i = 0; i < sizeof(ports) / sizeof(ports[0]); i++) {
    char url[128];
    snprintf(url, sizeof(url), "http://127.0.0.1:%s", ports[i]);
    if (curl_contains_replysuite(url)) {
      open_url(url);
      return 0;
    }
  }

  for (size_t i = 0; i < sizeof(ports) / sizeof(ports[0]); i++) {
    char url[128];
    char log_file[4096];
    snprintf(url, sizeof(url), "http://127.0.0.1:%s", ports[i]);
    snprintf(log_file, sizeof(log_file), "/tmp/SMART ReplySuite/replysuite-server-%s.log", ports[i]);

    if (!start_server(node, server_path, ports[i], log_file)) continue;

    for (int attempt = 0; attempt < 30; attempt++) {
      usleep(200000);
      if (curl_contains_replysuite(url)) {
        open_url(url);
        return 0;
      }
    }
  }

  return 0;
}
